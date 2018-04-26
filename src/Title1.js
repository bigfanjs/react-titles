import React, { Component, Fragment } from "react";
import { Motion, spring } from "react-motion";
import PropTypes from "prop-types";
import uniqid from "uniqid";

const config = { stiffness: 30, damping: 10 };

const FakeMotion = ({children}) => children({});

class Title extends Component {
    constructor(props) {
        super(props);

        this.id = uniqid();

        this.state = {
            bbox: { width: 0, height: 0 },
            open: this.props.open,
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
            return {
                open: nextProps.open,
                close: false
            };
        }

        return null;
    }

    componentDidMount() {
        this.setState({
            bbox: this.text.getBBox()
        });
    }

    calculateRectStyle = ({ scale, rotation }) => ({
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "center center"
    });

    calculateTextStyle = ({ y }, scale) => ({
        fontFamily: this.props.fontFamily,
        transform: `translateY(${y}px) scale(${scale})`,
        transformOrigin: "center center"
    });

    getDefaultStyle = (y) => {
        if (this.state.open) {
            return Object.assign(this.start, { y });
        } else {
            return this.end;
        }
    }

    getStyles = (Y) => {
        const styles = this.state.open ? this.end : this.start;
        const { scale, rotation, y = Y } = styles;

        return {
            scale: spring(scale),
            rotation: spring(rotation),
            y: spring(y)
        };
    };

    handleRest = () => {
        if (!this.state.open) {
            this.setState({
                close: true
            });
        }
    }

    render() {
        const { text, size } = this.props;
        const { width, height } = this.state.bbox;
        const center = size / 2;
        const strokeWidth = Math.ceil(size * this.strokeWidth / 100);
        const boxSize = size * this.boxSize / 100;

        const values = /\*(\w+)\*/g.exec(text) || [];
        const index = values ? text.indexOf(values[0]) : text.length;

        const scale = width ? size / width : 1;
        const gap = height * 0.9 * scale / 2;

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
                    defaultStyle={this.getDefaultStyle(height * scale)}
                    style={this.getStyles(height * scale)}
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
                                    {text.slice(0, index)}
                                    {   !!values.length &&
                                        <tspan
                                            alignmentBaseline="central"
                                            fontWeight="bold">
                                            {values[1]}
                                        </tspan>
                                    }
                                    {   !!values.length &&
                                        text.slice(index + values[0].length)
                                    }
                                </text>
                            </g>
                        </Fragment>
                    }
                </MotionComponent>
            </svg>
        );
    }
}

export default Title;