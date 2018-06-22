import React, { Component, Fragment } from "react";
import { Motion, spring } from "react-motion";
import PropTypes from "prop-types";

class Title extends Component {
    constructor(props) {
        super(props);

        const { text, open } = this.props;

        this.state = {
            scale: 0,
            gap: 0,
            open,
            close: !open,
            text
        };

        this.size = this.props.size;
        this.center = this.size / 2;
        this.strokeWidth = 2;
        this.half = this.center * 0.7;

        this.start = {
            d: 0,
            s: 0,
            r: 270,
            x1: this.center + this.half,
            x2: this.center - this.half
        };
        this.end = { s: 1, r: 45, x1: this.center, x2: this.center };
    }

    static propTypes = {
        text: PropTypes.string,
        size: PropTypes.number
    };

    static getDerivedStateFromProps({ open, text }, { open: prevOpen, text: prevText }) {
        if (open !== prevOpen) return { open, close: false };
        if (text !== prevText) return { text, scale: 0 };

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { open, close, scale, text } = this.state;

        return (
            nextState.open  !== open   ||
            nextState.close !== close  ||
            nextState.scale !== scale  ||
            nextState.text  !== text
        );
    }

    componentDidMount() {
        this.recalculate();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.text !== prevState.text) this.recalculate();
    }

    recalculate = () => {
        const bbox = this.text.getBBox();
        const { scale, gap } = this.getScaleAndGap(bbox);

        this.setState({ scale, gap });
    }

    getScaleAndGap = ({ width = 0, height = 0 }) => {
        const scale = width ? (this.size * 0.7) / width : 1;
        const gap = height * 0.8 * scale / 2;

        return { scale, gap };
    }

    getStyle = (dasharray) => {
        const config = { stiffness: 40, damping: 13 };
        const {open, scale} = this.state;
        const { s, r, x1, x2, d = dasharray } = open ? this.end : this.start;

        if (!scale) return this.start;

        return {
            d: spring(d, config),
            s: spring(s, config),
            r: spring(r, config),
            x1: spring(x1, config),
            x2: spring(x2, config)
        };
    };

    getDefaultStyle = (d) => {
        return this.state.open ? this.start : { ...this.end, d };
    }

    handleRest = () => {
        const onComplete = this.props.onComplete;

        if (!this.state.open) this.setState({ close: true });
        if (onComplete) onComplete(this.state.open);
    }

    render() {
        const {size, style} = this.props;
        const center = this.props.size / 2;
        const { text, scale, gap, close } = this.state;
        const strokeWidth = size * this.strokeWidth / 100;
        const boxSize = (size / 1.5) - strokeWidth;
        const half = this.half;

        return (
            !close &&
            <svg width={size} height={size} style={style}>
                <defs>
                    <clipPath id="clip1">
                        <rect x={center - half} y={center - gap} width={half} height={gap * 2} />
                    </clipPath>
                    <clipPath id="clip2">
                        <rect x={center} y={center - gap} width={half} height={gap * 2} />
                    </clipPath>
                </defs>
                <Motion
                    defaultStyle={this.getDefaultStyle(boxSize * 4)}
                    style={this.getStyle(boxSize * 4)}
                    onRest={this.handleRest}>
                    {({ d, s, r, x1, x2 }) => (
                        <Fragment>
                            <rect
                                x={center - boxSize / 2}
                                y={center - boxSize / 2}
                                width={boxSize}
                                height={boxSize}
                                stroke="yellow"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${Math.max(d, 0)} ${Math.max(boxSize * 4 - d, 0)}`}
                                strokeDashoffset={strokeWidth / 2}
                                fill="transparent"
                                style={{ transform: `scale(${s}) rotate(${r}deg)`, transformOrigin: "center" }}
                            />
                            <g clipPath="url(#clip1)">
                                <text
                                    id="text-1"
                                    ref={(el) => this.text = el}
                                    fill="white"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="central"
                                    dominantBaseline="central"
                                    style={{ transform: `translate(${x1}px, ${this.center}px) scale(${(scale)})` }}>
                                        { text }
                                </text>
                            </g>
                            <g clipPath="url(#clip2)">
                                <text
                                    id="text-2"
                                    fill="white"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="central"
                                    dominantBaseline="central"
                                    style={{ transform: `translate(${x2}px, ${this.center}px) scale(${(scale)})` }}>
                                        { text }
                                </text>
                            </g>
                        </Fragment>
                    )}
                </Motion>
                {/* <rect x={center - center * 0.7} y={center - gap} width={center * 0.7} height={gap * 2} fill="rgba(255, 0, 0, 0.32)" />
                <rect x={center} y={center - gap} width={center * 0.7} height={gap * 2} fill="rgba(0, 128, 0, 0.4)" /> */}
                {/* <circle cx={center} cy={center} r="3" />
                <line x1="0" y1={center} x2={size} y2={center} stroke="#000" />
                <line x1={center} y1="0" x2={center} y2={size} stroke="#000" /> */}
            </svg>
        );
    }
}

export default Title;