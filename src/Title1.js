import React, { Component, Fragment } from "react";
import { Motion as RealMotion, spring } from "react-motion";
import PropTypes from "prop-types";
import uniqid from "uniqid";

const config = { stiffness: 30, damping: 10 };

const FakeMotion = ({ children }) => children({});
const Text = (props) => {
    const text = props.text;
    const values = /\*(\w+)\*/g.exec(text) || [];

    if (values.length) {
        const index = text.indexOf(values[0]);

        return [
            text.slice(0, index),
            <tspan
                key="tspan"
                alignmentBaseline="central"
                fontWeight="bold">
                {values[1]}
            </tspan>,
            text.slice(index + values[0].length)
        ];
    }

    return text;
};

class Title extends Component {
    constructor(props) {
        super(props);

        this.id = uniqid();

        this.state = {
            bboxs: [],
            texts: [this.props.text],
            open: this.props.open,
            close: !this.props.open
        };

        this.strokeWidth = 2.5;
        this.boxSize = 62.5;

        this.start = { scale: 0, rotation: 0 };
        this.end = { scale: 1, rotation: 90, y1: 0 };
    }

    static propTypes = {
        size: PropTypes.number,
        fontFamily: PropTypes.string,
        text: PropTypes.string,
        open: PropTypes.bool
    };

    static getDerivedStateFromProps({open: isOpen, text}, {open, texts}) {
        if (isOpen !== open) {
            return { open: isOpen, close: false, texts: [texts[0]] };
        } else if (isOpen && text !== texts[0]) {
            return { bboxs: [], texts: [text, texts[0]] };
        }

        return null;
    }

    componentDidMount() {
        this.setState({ bboxs: [this.text.getBBox()] });
    }

    componentDidUpdate(prevProps, { texts, bboxs }) {
        if (texts[0] !== this.state.texts[0]) {
            this.setState({
                bboxs: [this.text.getBBox(), bboxs[0]]
            });
        }
    }

    calculateRectStyle = ({ scale, rotation }) => ({
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "center center"
    });

    calculateTextStyle = (style, scale, isPrev = false) => ({
        fontFamily: this.props.fontFamily,
        transform: `translateY(${ style[ isPrev ? "y2" : "y1" ] }px) scale(${scale})`,
        transformOrigin: "center center"
    });

    getDefaultStyle = (y1) => {
        const texts = this.state.texts;
        const styles = texts.length > 1 ? {...this.end, y2: 0, rotation: 0} : this.start;

        return { ...styles, y1 };
    }

    getStyles = (scale1, scale2) => {
        const {open, texts} = this.state;

        const isTitleChanged = texts.length > 1;
        const styles = isTitleChanged || open ? this.end : this.start;
        const { scale, rotation, y1 = scale1 } = styles;

        return {
            scale: spring(scale, config),
            rotation: spring(rotation, config),
            y1: spring(y1, config),
            y2: isTitleChanged ? spring(-Math.max(scale1, scale2), config) : 0
        };
    };

    handleRest = () => {
        if (!this.state.open) this.setState({ close: true });
    }

    getScalesAndGaps = (bboxs) => {
        if (!bboxs[0]) return { scales: [0], gaps: [0], ys: [0] };

        return bboxs
            .filter((bbox) => bbox)
            .reduce(({ scales, gaps, ys }, { width, height }) => {
                const scale = width ? this.props.size / width : 1;
                const gap = height * 0.9 * scale / 2;
                const y = height * scale;

                return {
                    scales: [...scales, scale],
                    gaps: [...gaps, gap],
                    ys: [...ys, y]
                };
            }, { scales: [], gaps: [], ys: [] });
    }

    render() {
        const size = this.props.size;
        const center = size / 2;
        const { texts, bboxs } = this.state;
        const Motion = bboxs.length ? RealMotion : FakeMotion;
        const strokeWidth = Math.ceil(size * this.strokeWidth / 100);
        const boxSize = size * this.boxSize / 100;
        const { scales, gaps, ys } = this.getScalesAndGaps(bboxs);

        return (
            !this.state.close &&
            <svg width={size} height={size}>
                <defs>
                    <clipPath id={`clip-sides-${this.id}`}>
                        <rect x="0" y="0" width={size} height={center - gaps[0]} />
                        <rect x="0" y={center + gaps[0]} width={size} height={center - gaps[0]} />
                    </clipPath>

                    <clipPath id={`clip-middle-${this.id}`}>
                        <rect x="0" y={center - gaps[0]} width={size} height={gaps[0] * 2} />
                    </clipPath>
                </defs>
                <Motion
                    defaultStyle={this.getDefaultStyle(...ys)}
                    style={this.getStyles(...ys)}
                    onRest={this.handleRest}>
                    {(styles) =>
                        <Fragment>
                            <g clipPath={`url(#clip-sides-${this.id})`}>
                                <rect
                                    x={center - boxSize / 2}
                                    y={center - boxSize / 2}
                                    width={boxSize}
                                    height={boxSize}
                                    fill="transparent"
                                    stroke="rgb(249, 178, 63)"
                                    strokeWidth={strokeWidth}
                                    style={this.calculateRectStyle(styles)}
                                />
                            </g>
                            <g clipPath={`url(#clip-middle-${this.id})`}>
                                <text
                                    ref={el => this.text = el}
                                    x={center}
                                    y={center}
                                    fill="white"
                                    textAnchor="middle"
                                    alignmentBaseline="central"
                                    style={this.calculateTextStyle(styles, scales[0])}>
                                        <Text text={texts[0]} />
                                </text>
                                {   texts[1] &&
                                    <text
                                        x={center}
                                        y={center}
                                        fill="white"
                                        textAnchor="middle"
                                        alignmentBaseline="central"
                                        style={this.calculateTextStyle(styles, scales[1], true)}>
                                            <Text text={texts[1]} />
                                    </text>
                                }
                            </g>
                        </Fragment>
                    }
                </Motion>
            </svg>
        );
    }
}

export default Title;