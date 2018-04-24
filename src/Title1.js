import React, { Component, Fragment } from "react";
import { Motion, spring } from "react-motion";
import PropTypes from "prop-types";

const config = { stiffness: 30, damping: 10 };

class Title extends Component {
    state = { bbox: { width: 0, height: 0 } };

    static propTypes = {
        size: PropTypes.number,
        fontFamily: PropTypes.string,
        text: PropTypes.string
    };

    size = this.props.size;
    center = this.size / 2;

    strokeWidth = 2.5;
    box = 62.5;

    boxSize = this.size * this.box / 100;
    halfBoxSize = this.boxSize / 2;

    start = { scale: 0, rotation: 0 };
    end = {
        scale: spring(1, config),
        rotation: spring(90, config),
        y: spring(0, config)
    };

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

    render() {
        const { text, size } = this.props;
        const center = size / 2;
        const strokeWidth = Math.ceil(size * this.strokeWidth / 100);
        const { width, height } = this.state.bbox;

        const values = /\*(\w+)\*/g.exec(text) || [];
        const index = values ? text.indexOf(values[0]) : text.length;

        const scale = width ? size / width : 1;
        const gap = height * 0.9 * scale / 2;

        return (
            <svg width={size} height={size}>
                <defs>
                    <clipPath id="clip-sides">
                        <rect x="0" y="0" width={size} height={center - gap} />
                        <rect x="0" y={center + gap} width={size} height={center - gap} />
                    </clipPath>

                    <clipPath id="clip-middle">
                        <rect x="0" y={center - gap} width={size} height={gap * 2} />
                    </clipPath>
                </defs>
                <Motion defaultStyle={Object.assign(this.start, { y: gap * 2 })} style={this.end}>
                    {(styles) =>
                        <Fragment>
                            <g clipPath="url(#clip-sides)">
                                <rect
                                    x={center - this.boxSize / 2}
                                    y={center - this.boxSize / 2}
                                    width={this.boxSize}
                                    height={this.boxSize}
                                    fill="transparent"
                                    stroke="rgb(249, 178, 63)"
                                    strokeWidth={strokeWidth}
                                    style={this.calculateRectStyle(styles)}
                                />
                            </g>
                            <g clipPath="url(#clip-middle)">
                                <text
                                    ref={el => this.text = el}
                                    x={center}
                                    y={center}
                                    fill="white"
                                    textAnchor="middle"
                                    alignmentBaseline="central"
                                    style={this.calculateTextStyle(styles, scale)}
                                >
                                    {text.slice(0, index)}
                                    {!!values.length &&
                                        <tspan alignmentBaseline="central" fontWeight="bold">{values[1]}</tspan>
                                    }
                                    {!!values.length && text.slice(index + values[0].length)}
                                </text>
                            </g>
                        </Fragment>
                    }
                </Motion>
            </svg>
        );
    }
}

export default Title;