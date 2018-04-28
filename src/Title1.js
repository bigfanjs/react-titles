import React, { Component, Fragment } from "react";
import { Motion, spring } from "react-motion";
import PropTypes from "prop-types";
import uniqid from "uniqid";

const config = { stiffness: 30, damping: 10 };

const FakeMotion = ({children}) => children({});

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
            bbox: { width: 0, height: 0 },
            prevBbox: { prevWidth: 0, prevHeight: 0 },
            open: this.props.open,
            text: this.props.text,
            prevText: null,
            close: !this.props.open
        };

        this.strokeWidth = 2.5;
        this.boxSize = 62.5;

        this.start = { scale: 0, rotation: 0 };
        this.end = { scale: 1, rotation: 90, y: 0 };
    }

    static propTypes = {
        size: PropTypes.number,
        fontFamily: PropTypes.string,
        text: PropTypes.string,
        open: PropTypes.bool
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.open !== prevState.open) {
            return { open: nextProps.open, close: false, prevText: null };
        } else if (nextProps.open && nextProps.text !== prevState.text) {
            return {
                bbox: { width: 0, height: 0 },
                text: nextProps.text,
                prevText: prevState.text
            };
        }

        return null;
    }

    componentDidMount() {
        this.setState({
            bbox: this.text.getBBox()
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.text !== this.state.text) {
            this.setState({
                bbox: this.text.getBBox(),
                prevBbox: {
                    prevWidth: prevState.bbox.width,
                    prevHeight: prevState.bbox.height
                }
            });
        }
    }

    calculateRectStyle = ({ scale, rotation }) => ({
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "center center"
    });

    calculateTextStyle = (style, scale) => ({
        fontFamily: this.props.fontFamily,
        transform: `translateY(${ style.y }px) scale(${ scale })`,
        transformOrigin: "center center"
    });

    calculatePrevTextStyle = (style, scale) => ({
        fontFamily: this.props.fontFamily,
        transform: `translateY(${ style.prevY }px) scale(${ scale })`,
        transformOrigin: "center center"
    });

    getDefaultStyle = (y) => {
        const {open, prevText} = this.state;

        if (!open) return null;

        if (prevText === null) {
            return Object.assign({}, this.start, { y });
        }

        return Object.assign({}, this.end, { y, prevY: 0 });
    }

    getStyles = (Y, prevY) => {
        const { open, prevText } = this.state;

        if (prevText === null) {
            const styles = open ? this.end : this.start;
            const { scale, rotation, y = Y } = styles;

            return {
                scale: spring(scale, config),
                rotation: spring(rotation, config),
                y: spring(y, config)
            };
        } else {
            const yy = Y > prevY ? Y : prevY;
            const { scale, rotation, y } = this.end;

            return {
                scale: spring(scale, config),
                rotation: spring(rotation * 2, config),
                y: spring(y, config),
                prevY: spring(-yy, config)
            };
        }
    };

    handleRest = () => {
        const { open, prevText } = this.state;

        if (!open) {
            this.setState({
                close: true
            });
        }

        if (prevText) {
            this.setState({
                prevText: null
            });
        }
    }

    render() {
        const size = this.props.size;
        const {
            text,
            prevText,
            bbox: { width, height },
            prevBbox: { prevWidth, prevHeight }
        } = this.state;
        const center = size / 2;
        const strokeWidth = Math.ceil(size * this.strokeWidth / 100);
        const boxSize = size * this.boxSize / 100;

        const scale = width ? size / width : 1;
        const gap = height * 0.9 * scale / 2;

        const prevScale = prevWidth ? size / prevWidth : 1;

        const MotionComponent = height ? Motion : FakeMotion;

        return (
            !this.state.close &&
            <svg width={size} height={size}>
                <defs>
                    <clipPath id={`clip-sides-${this.id}`}>
                        <rect x="0" y="0" width={size} height={center - gap} />
                        <rect x="0" y={center + gap} width={size} height={center - gap} />
                    </clipPath>

                    <clipPath id={`clip-middle-${this.id}`}>
                        <rect x="0" y={center - gap} width={size} height={gap * 2} />
                    </clipPath>
                </defs>
                <MotionComponent
                    defaultStyle={this.getDefaultStyle(height * scale, prevHeight * prevScale)}
                    style={this.getStyles(height * scale, prevHeight * prevScale)}
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
                                    style={this.calculateTextStyle(styles, scale)}>
                                        <Text text={text} />
                                </text>
                                {   prevText &&
                                    <text
                                        x={center}
                                        y={center}
                                        fill="white"
                                        textAnchor="middle"
                                        alignmentBaseline="central"
                                        style={this.calculatePrevTextStyle(styles, prevScale)}>
                                            <Text text={prevText} />
                                    </text>
                                }
                            </g>
                        </Fragment>
                    }
                </MotionComponent>
            </svg>
        );
    }
}

export default Title;