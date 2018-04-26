import React, { Component, Fragment } from "react";
import { TransitionMotion, spring } from "react-motion";
import PropTypes from "prop-types";
import uniqid from "uniqid";

const config = { stiffness: 30, damping: 10 };

class Title extends Component {
    constructor(props) {
        super(props);

        this.id = uniqid();

        this.state = {
            bbox: { width: 0, height: 0 },
            items: [],
            mounted: false,
            open: this.props.open
        };

        this.strokeWidth = 2.5;
        this.boxSize = 62.5;
    }

    static propTypes = {
        size: PropTypes.number,
        fontFamily: PropTypes.string,
        text: PropTypes.string,
        open: PropTypes.bool,
        onLeave: PropTypes.func
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.open !== prevState.open) {
            const style = { key: "title1", scale: 1, rotation: 90, y: 0 };

            return {
                items: nextProps.open ? [style] : [],
                open: nextProps.open
            };
        }

        return null;
    }

    componentDidMount() {
        this.setState({
            bbox: this.text.getBBox(),
            items: [{
                key: "title1",
                scale: 1,
                rotation: 90,
                y: 0
            }]
        });
    }

    willLeave(y) {
        return {
            y: spring(y, config),
            scale: spring(0, config),
            rotation: spring(0, config)
        };
    }

    willEnter(y) {
        return { y, scale: 0, rotation: 0 };
    }

    didLeave = () => {
        this.props.onLeave();
    }

    getStyles = () => (
        this.state.items.map(({ key, y, scale, rotation }) => ({
            key: key,
            style: {
                y: spring(y, config),
                scale: spring(scale, config),
                rotation: spring(rotation, config)
            }
        }))
    )

    calculateRectStyle = ({ scale, rotation }) => ({
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "center center"
    });

    calculateTextStyle = (style, scale) => ({
        fontFamily: this.props.fontFamily,
        transform: `translateY(${style.y}px) scale(${scale})`,
        transformOrigin: "center center"
    });

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

        return (
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
                <TransitionMotion
                    styles={this.getStyles()}
                    willLeave={this.willLeave.bind(null, height * scale)}
                    willEnter={this.willEnter.bind(null, height * scale)}
                    didLeave={this.didLeave}>
                    {(items) => {
                        const style = items.length && items[0].style;

                        return (
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
                                        style={this.calculateRectStyle(style)}
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
                                        style={this.calculateTextStyle(style, scale)}>
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
                        );
                    }}
                </TransitionMotion>
            </svg>
        );
    }
}

export default Title;