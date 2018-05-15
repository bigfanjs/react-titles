import React, { Component, Fragment } from "react";
import { Motion, spring } from "react-motion";
import PropTypes from "prop-types";
import isEqual from "lodash/isEqual";

class Title extends Component {
    constructor(props) {
        super(props);

        const { text1, text2, open } = this.props;

        this.texts = [];
        this.rects = [];
        this.sizes = [25, 7.5];

        this.state = {
            scales: [0, 0],
            gaps: [0, 0],
            open,
            close: !open,
            texts: [text1, text2]
        };

        this.size = this.props.size;
        this.center = this.size / 2;
        this.strokeWidth = 3.75;

        this.start = { d: 0, x: 150, y: 95 };
        this.end = { x: 50, y: 82 };
        this.isFirefox = typeof InstallTrigger !== "undefined";
    }

    static propTypes = {
        text1: PropTypes.string,
        text2: PropTypes.string,
        size: PropTypes.number
    };

    static getDerivedStateFromProps({ open, text1, text2 }, { open: prevOpen, texts }) {
        if (open !== prevOpen) return { open: open, close: false };
        if (!isEqual([text1, text2], texts)) return { texts: [text1, text2], scales: [0, 0] };

        return null;
    }

    shouldComponentUpdate(nextProps, { open, texts, scales, close }) {
        return (
            open !== this.state.open ||
            close !== this.state.close ||
            !isEqual(this.state.scales, scales) ||
            !isEqual(this.state.texts, texts)
        );
    }

    componentDidMount() {
        this.recalculate();
    }

    componentDidUpdate(prevProps, { open: pOpen, close: wasClosed, scales: pScales, texts }) {
        const { scales, close, open } = this.state;

        if (!close && !isEqual(this.state.texts, texts)) this.recalculate();
    }

    recalculate = () => {
        const bboxs = this.texts.map((text) => text.getBBox());
        const sizes = this.sizes.map((size) => this.size - (this.size * size/ 100));

        const { scales, gaps, widths } = this.getScalesAndGaps(bboxs, sizes);

        this.setState({ scales, gaps, widths });
    }

    getScalesAndGaps = (bboxs, sizes) => {
        return bboxs.reduce(({ scales, gaps, widths }, { width = 0, height = 0 }, id) => {
            const scale = width ? sizes[id] / width : 1;
            const gap = height * 0.7 * scale / 2;

            return {
                scales: [...scales, scale],
                gaps: [...gaps, gap],
                widths: [...widths, width * scale]
            };
        }, { scales: [], gaps: [], widths: [] });
    }

    getStyle = (dasharray) => {
        const config = { stiffness: 30, damping: 10 };
        const { open, scales } = this.state;
        const { x, y, d = dasharray } = open ? this.end : this.start;

        if (!scales[0] && !scales[1]) return this.start;

        return {
            x: spring(x, config),
            y: spring(y, config),
            d: spring(d, config)
        };
    };

    getDefaultStyle = (d) => {
        return this.state.open ? this.start : { ...this.end, d };
    }

    render() {
        const size = this.props.size;
        const { texts, scales, gaps, close } = this.state;
        const strokeWidth = size * this.strokeWidth / 100;
        const boxSize = size - strokeWidth;

        return (
            !close &&
            <svg width={size} height={size}>
                <defs>
                    <clipPath id="clipo">
                        <rect
                            x={strokeWidth}
                            y={size * 0.45 - gaps[1]}
                            width={boxSize - strokeWidth}
                            height={gaps[0] + gaps[1] + size * (0.82 - 0.45)}
                        />
                    </clipPath>
                </defs>
                <Motion
                    defaultStyle={this.getDefaultStyle(boxSize * 4)}
                    style={this.getStyle(boxSize * 4)}>
                    {({ d, x, y }) => (
                        <Fragment>
                            <rect
                                ref={(el) => this.rects[0] = el}
                                x={strokeWidth / 2}
                                y={strokeWidth / 2}
                                width={boxSize}
                                height={boxSize}
                                stroke="yellow"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${Math.max(d, 0)} ${Math.max(boxSize * 4 - d, 0)}`}
                                strokeDashoffset={boxSize * 2.5}
                                fill="transparent"
                            />
                            <g clipPath="url(#clipo)">
                                <text
                                    id="text-2"
                                    ref={(el) => this.texts[1] = el}
                                    fill="white"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="central"
                                    style={{ transform: `translate(${x}%, 45%) scale(${scales[1]})` }}>
                                        { texts[1] }
                                </text>
                                <text
                                    id="text-1"
                                    ref={(el) => this.texts[0] = el}
                                    fill="white"
                                    textAnchor="middle"
                                    alignmentBaseline="central"
                                    style={{ transform: `translate(50%, ${y}%) scale(${scales[0]})` }}>
                                        { texts[0] }
                                </text>
                            </g>
                        </Fragment>
                    )}
                </Motion>
            </svg>
        );
    }
}

export default Title;