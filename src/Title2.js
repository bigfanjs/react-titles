import React, { Component } from "react";
import PropTypes from "prop-types";
import { TimelineMax, Power4 } from "gsap";
import isEqual from "lodash/isEqual";

class Title extends Component {
    constructor(props) {
        super(props);

        const {text1, text2, open} = this.props;

        this.texts = [];
        this.rect = null;

        this.state = {
            scales: [0, 0],
            gaps: [0, 0],
            widths: [0, 0],
            open,
            close: false,
            texts: [text1, text2]
        };

        this.timeline = null;
    }

    static propTypes = {
        text1: PropTypes.string,
        text2: PropTypes.string,
        size: PropTypes.number
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.open !== prevState.open) {
            return { open: nextProps.open, close: false };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { open, scales } = this.state;

        return nextState.open !== open || !scales[0];
    }

    componentDidMount() {
        const bboxs = this.texts.map((text) => text.getBBox());
        const { scales, gaps, widths } = this.getScalesAndGaps(bboxs);

        this.setState({ scales, gaps, widths });
    }

    componentDidUpdate(prevProps, prevState) {
        const {scales, widths} = this.state;
        const ease = Power4.easeOut;

        if (!isEqual(this.state.scales, prevState.scales)) {
            const text1Timeline = new TimelineMax();
            const text2Timeline = new TimelineMax({ delay: 1 });
            const rectTimeline = new TimelineMax();

            text1Timeline.set(this.texts[0], {scale: scales[0], transformOrigin: "center"});
            text1Timeline.from(this.texts[0], 1, { x: -widths[0], ease });

            rectTimeline.from(this.rect, 1, { scaleX: 0, transformOrigin: "right", ease });
            rectTimeline.from(this.rect, 1, { scaleY: 0.1, transformOrigin: "right", ease });

            text2Timeline.set(this.texts[1], { scale: scales[1], transformOrigin: "center" });
            text2Timeline.from(this.texts[1], 1, { y: 100, ease });

            this.timeline = new TimelineMax({ paused: true });
            this.timeline.add([ text1Timeline, text2Timeline, rectTimeline ]);
        }

        if (this.state.open) {
            this.timeline.play();
        } else if (!this.state.open) {
            this.timeline.reverse();
        }
    }

    getScalesAndGaps = (bboxs) => {
        return bboxs
            .reduce(({ scales, gaps, widths }, { width=0, height=0 }) => {
                const scale = width ? this.props.size / width : 1;
                const gap = height * 0.75 * scale / 2;

                return {
                    scales: [...scales, scale],
                    gaps: [...gaps, gap],
                    widths: [ ...widths, width * scale ]
                };
            }, { scales: [], gaps: [], widths: [] });
    }

    render() {
        const size = this.props.size;
        const { texts, gaps } = this.state;

        const height = (gaps[1] + gaps[0]) * 2;
        const center = {x: size / 2, y: height / 2};

        return (
            <svg width={size} height={height}>
                <defs>
                    <mask id="myMask">
                        <rect width="100%" height="100%" fill="#fff" />
                        <text
                            id="text-1"
                            x={center.x}
                            y={gaps[0] * 2 + gaps[1]}
                            ref={(el) => this.texts[1] = el}
                            alignmentBaseline="central"
                            textAnchor="middle">
                                { texts[1] }
                        </text>
                    </mask>
                </defs>
                <text
                    id="text-2"
                    x={center.x}
                    y={gaps[0]}
                    ref={(el) => this.texts[0] = el}
                    fill="white"
                    textAnchor="middle"
                    alignmentBaseline="central">
                        { texts[0] }
                </text>
                <g mask="url(#myMask)">
                    <rect
                        ref={(el) => this.rect = el}
                        x="0"
                        y={gaps[0] * 2}
                        width={size}
                        height={(gaps[1]) * 2}
                        fill="yellow"
                    />
                </g>
            </svg>
        );
    }
}

export default Title;