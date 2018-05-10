import React, { Component } from "react";
import PropTypes from "prop-types";
import { TimelineMax, Power3 } from "gsap";
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

    static getDerivedStateFromProps({open, text1, text2}, { open: prevOpen, texts }) {
        if (open !== prevOpen) return { open: open, close: false };

        if (!isEqual([text1, text2], texts)) {
            return {
                texts: [text1, text2],
                close: false,
                scales: [0, 0],
                gaps: [0, 0],
                widths: [0, 0]
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, { open: nextOpen, texts: nextTexts, scales: nextScales }) {
        const { open, scales, texts } = this.state;

        return nextOpen !== open || !isEqual(scales, nextScales) || !isEqual(texts, nextTexts);
    }

    componentDidMount() {
        this.recalculate();
    }

    componentDidUpdate(prevProps, prevState) {
        const { scales, gaps, widths } = this.state;

        if (!isEqual(scales, prevState.scales) && widths[0] && scales[0] && gaps[0]) {
            if (this.timeline) this.timeline.kill();
            this.animate();
        }

        if (this.state.open) this.timeline.play();
        else this.timeline.reverse();

        this.recalculate();
    }

    recalculate = () => {
        const bboxs = this.texts.map((text) => text.getBBox());
        const { scales, gaps, widths } = this.getScalesAndGaps(bboxs);

        this.setState({ scales, gaps, widths });
    }

    animate = () => {
        const { scales, gaps, widths } = this.state;
        const ease = Power3.easeOut;

        const text1Timeline = new TimelineMax();
        const text2Timeline = new TimelineMax({ delay: 1 });
        const rectTimeline = new TimelineMax();

        text1Timeline.fromTo(
            this.texts[0],
            1,
            {   scale: scales[0],
                x: -widths[0] / 2,
                y: gaps[0],
                transformOrigin: "center"      },
            { x: this.props.size / 2 + 4, ease }
        );

        rectTimeline
            .fromTo(
                this.rect,
                1,
                { scaleX: 0, transformOrigin: "right", ease },
                { scaleX: 1 }
            )
            .fromTo(
                this.rect,
                0.5,
                { y: gaps[0] * 2, scaleY: 0.1 },
                { scaleY: 1, transformOrigin: "right", ease }
            );

        text2Timeline.fromTo(
            this.texts[1],
            0.7,
            {   scale: scales[1],
                x: this.props.size / 2,
                y: (gaps[0] + gaps[1]) * 3,
                transformOrigin: "center"      },
            {   y: gaps[0] * 2 + gaps[1], ease }
        );

        this.timeline = new TimelineMax({ paused: true });
        this.timeline.add([text1Timeline, text2Timeline, rectTimeline]);
    }

    getScalesAndGaps = (bboxs) => {
        return bboxs.reduce(({ scales, gaps, widths }, { width=0, height=0 }) => {
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

        return (
            <svg width={size} height={(gaps[1] + gaps[0]) * 2}>
                <defs>
                    <mask id="myMask">
                        <rect width="100%" height="100%" fill="#fff" />
                        <text
                            id="text-1"
                            ref={(el) => this.texts[1] = el}
                            alignmentBaseline="central"
                            fontWeight="bold"
                            textAnchor="middle">
                                { texts[1] }
                        </text>
                    </mask>
                </defs>
                <text
                    id="text-2"
                    ref={(el) => this.texts[0] = el}
                    fill="white"
                    textAnchor="middle"
                    alignmentBaseline="central">
                        { texts[0] }
                </text>
                <g mask="url(#myMask)">
                    <rect
                        ref={(el) => this.rect = el}
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