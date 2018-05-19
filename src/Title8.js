import React, { Component, Fragment } from "react";
import { Motion as RealMotion, spring } from "react-motion";
import PropTypes from "prop-types";
import isEqual from "lodash/isEqual";

const FakeMotion = ({ children }) => children({});

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
        this.offset = 7.5;
        this.dasharray = 20;

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

    componentDidUpdate(prevProps, prevState) {
        if (!isEqual(this.state.texts, prevState.texts)) this.recalculate();
    }

    recalculate = () => {
        const bboxs = this.texts.map((text) => text.getBBox());
        const sizes = this.sizes.map((size) => this.size - (this.size * size / 100));
        const { scales, gaps } = this.getScalesAndGaps(bboxs, sizes);

        this.setState({ scales, gaps });
    }

    getScalesAndGaps = (bboxs) => {
        return bboxs.reduce(({ scales, gaps }, { width = 0, height = 0 }) => {
            const scale = width ? this.props.size / width : 1;
            const gap = height * 0.7 * scale / 2;

            return { scales: [...scales, scale], gaps: [...gaps, gap] };
        }, { scales: [], gaps: [] });
    }

    getStyle = (start, end) => {
        const config = { stiffness: 30, damping: 10 };

        const { x, y, scaleX } = this.state.open ? end : start;

        return {
            x: spring(x, config),
            y: spring(y, config),
            scaleX: spring(scaleX, config)
        };
    };

    getDefaultStyle = (start, end) => {
        return this.state.open ? start : end;
    }

    handleRest = () => {
        if (!this.state.open) this.setState({ close: true });
    }

    render() {
        const size = this.props.size;
        const { texts, scales, gaps, close } = this.state;
        const Motion = (scales[0] && scales[1]) ? RealMotion : FakeMotion;
        const offset = size * this.offset / 100;
        const height = (gaps[1] + gaps[0]) * 2 + offset;
        const middle = gaps[0] * 2 + offset;

        const start = { scaleX: 0, x: -size, y: middle - gaps[1] * 2 };
        const end = { scaleX: 1, x: this.center, y: middle + gaps[1] };

        return (
            !close &&
            <svg width={size} height={Math.min(height, size)}>
                <defs>
                    <clipPath id="clip">
                        <rect x="0" y={middle} width={size} height={gaps[1] * 2 + offset} />
                    </clipPath>
                </defs>
                <Motion
                    defaultStyle={this.getDefaultStyle(start, end)}
                    style={this.getStyle(start, end)}
                    onRest={this.handleRest}>
                    {({ x, y, scaleX }) => (
                        <Fragment>
                            <rect
                                ref={(el) => this.rects[0] = el}
                                x="0"
                                y="0"
                                width={size}
                                height={offset * 0.9}
                                fill="yellow"
                                style={{ transform: `scaleX(${ scaleX })`, transformOrigin: "right" }}
                            />
                            <text
                                id="text-1"
                                ref={(el) => this.texts[0] = el}
                                fill="white" // elegant
                                textAnchor="middle"
                                alignmentBaseline="central" // vertical centering in firefox
                                dominantBaseline="central"
                                style={{ transform: `translate(${x}px, ${gaps[0] + offset}px) scale(${(scales[0])})` }}>
                                    { texts[0] }
                            </text>
                            <g clipPath="url(#clip)">
                                {   this.isFirefox &&
                                    <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
                                }
                                <text
                                    id="text-2"
                                    ref={(el) => this.texts[1] = el}
                                    fill="white"
                                    alignmentBaseline="central"
                                    dominantBaseline="central" // vertical centering in firefox
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    style={{ transform: `translate(${this.center}px, ${y}px) scale(${(scales[1])})` }}>
                                        { texts[1] }
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