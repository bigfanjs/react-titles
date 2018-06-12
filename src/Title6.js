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

        this.state = {
            scales: [0, 0],
            gaps: [0, 0],
            open,
            close: !open,
            texts: [text1, text2]
        };

        this.size = this.props.size;
        this.forceClose = this.props.forceClose || false;
        this.center = this.size / 2;
        this.strokeWidth = 2;
        this.offset = 7.5;
        this.dasharray = 20;

        this.isFirefox = typeof InstallTrigger !== "undefined";
    }

    static propTypes = {
        text1: PropTypes.string,
        text2: PropTypes.string,
        size: PropTypes.number,
        forceClose: PropTypes.bool
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
        const { scales, gaps } = this.getScalesAndGaps(bboxs);

        this.setState({ scales, gaps });
    }

    getScalesAndGaps = (bboxs) => {
        return bboxs.reduce(({ scales, gaps }, { width = 0, height = 0 }) => {
            const scale = width ? (this.props.size*0.8) / width : 1;
            const gap = height * 0.7 * scale / 2;

            return { scales: [...scales, scale], gaps: [...gaps, gap] };
        }, { scales: [], gaps: [] });
    }

    getStyle = (start, end) => {
        const config = { stiffness: 30, damping: 10 };

        const { y1, y2, d } = this.state.open && !this.forceClose ? end : start;

        return {
            y1: spring(y1, config),
            y2: spring(y2, config),
            d: spring(d, config)
        };
    };

    getDefaultStyle = (start, end) => {
        return this.state.open && !this.forceClose ? start : end;
    }

    handleRest = () => {
        if (!this.state.open) this.setState({ close: true });
    }

    render() {
        const { size, style, innerRef, x, y} = this.props;
        const { texts, scales, gaps, close } = this.state;
        const Motion = (scales[0] && scales[1]) ? RealMotion : FakeMotion;
        const strokeWidth = size * this.strokeWidth / 100;
        const offset = size * this.offset / 100;
        const height = (gaps[1] + gaps[0] + offset) * 2;
        const middle = gaps[0] * 2 + offset;
        const box = { width: size - strokeWidth, height: height - strokeWidth };
        const boxSize = box.width + box.height;
        const dasharray = boxSize * this.dasharray / 100;

        const start = { d: 0, y1: middle + gaps[0] * 2, y2: middle - gaps[1] * 2 };
        const end = { d: dasharray, y1: gaps[0] + offset, y2: middle + gaps[1] };

        return (
            !close &&
            <svg x={x} y={y} width={size} height={height} style={style} ref={innerRef}>
                <defs>
                    <clipPath id="clip1">
                        <rect x="0" y="0" width={size} height={middle} />
                    </clipPath>
                    <clipPath id="clip2">
                        <rect x="0" y={middle} width={size} height={gaps[1] * 2 + offset} />
                    </clipPath>
                </defs>
                <Motion
                    defaultStyle={this.getDefaultStyle(start, end)}
                    style={this.getStyle(start, end)}
                    onRest={this.handleRest}>
                    {({ d, y1, y2 }) => (
                        <Fragment>
                            <rect
                                x={strokeWidth / 2}
                                y={strokeWidth / 2}
                                width={box.width}
                                height={box.height}
                                stroke="yellow"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${Math.max(d, 0)} ${Math.max(boxSize - d, 0)}`}
                                strokeDashoffset={ dasharray / 2 }
                                fill="transparent"
                            />
                            <g clipPath="url(#clip1)">
                                {   this.isFirefox &&
                                    <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
                                }
                                <text
                                    id="text-1"
                                    ref={(el) => this.texts[0] = el}
                                    fill="white" // elegant
                                    textAnchor="middle"
                                    alignmentBaseline="central" // vertical centering in firefox
                                    dominantBaseline="central"
                                    style={{transform: `translate(${this.center}px, ${y1}px) scale(${(scales[0])})`}}>
                                        { texts[0] }
                                </text>
                            </g>
                            <g clipPath="url(#clip2)">
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
                                    style={{ transform: `translate(${this.center}px, ${y2}px) scale(${(scales[1])})` }}>
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