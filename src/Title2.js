import React, { Component } from "react";
import PropTypes from "prop-types";
import { TimelineMax, Power3 } from "gsap";
import isEqual from "lodash/isEqual";

class Title extends Component {
    constructor(props) {
        super(props);

        const {text1, text2, open} = this.props;

        this.texts = [];
        this.text3 = null;
        this.rect = null;

        this.state = {
            scales: [0, 0],
            gaps: [0, 0],
            widths: [0, 0],
            open,
            close: !open,
            texts: [text1, text2]
        };

        this.timeline = null;
        this.isFirefox = typeof InstallTrigger !== "undefined";
    }

    static propTypes = {
        text1: PropTypes.string,
        text2: PropTypes.string,
        size: PropTypes.number
    };

    static getDerivedStateFromProps({open, text1, text2}, { open: prevOpen, texts }) {
        if (open !== prevOpen) return { open: open, close: false };
        if (!isEqual([text1, text2], texts)) return { texts: [text1, text2] };

        return null;
    }

    shouldComponentUpdate(nextProps, { open, texts, scales, close }) {
        return (
            open !== this.state.open            ||
            close !== this.state.close          ||
            !isEqual(this.state.scales, scales) ||
            !isEqual(this.state.texts, texts)
        );
    }

    componentDidMount() {
        this.recalculate();
    }

    componentDidUpdate(prevProps, { open: pOpen, close: wasClosed, scales: pScales, texts }) {
        const { scales, close, open } = this.state;

        if (!isEqual(scales, pScales) || wasClosed) {
            if (this.timeline) this.timeline.kill();
            this.animate();
        }

        if (!isEqual(scales, pScales) || open !== pOpen) {
            if (open) this.timeline.play();
            else this.timeline.reverse();
        }

        if (!close && !isEqual(this.state.texts, texts)) this.recalculate();
    }

    recalculate = () => {
        const bboxs = this.texts
            .filter((_, id) => id !== (this.isFirefox ? 1 : 2))
            .map((text) => text.getBBox());

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
            { x: this.props.size / 2, ease }
        );

        rectTimeline
            .fromTo(
                this.rect,
                1,
                { scaleX: 0, transformOrigin: "right" },
                { scaleX: 1, ease }
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

        this.timeline = new TimelineMax({ paused: true, onReverseComplete: this.handleRest });
        this.timeline.add([text1Timeline, text2Timeline, rectTimeline]);
    }

    handleRest = () => {
        const onComplete = this.props.onComplete;

        this.setState({ close: true });
        if (onComplete) onComplete(this.state.open);
    };

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
        const {size, style} = this.props;
        const { texts, gaps, close } = this.state;

        return (
            !close &&
            <svg width={size} height={(gaps[1] + gaps[0]) * 2} style={style}>
                {   this.isFirefox && // in firefox elements in <defs> are invisible.
                    <text
                        id="text-3"
                        ref={(el) => this.texts[2] = el}
                        fontWeight="bold"
                        fill="transparent">
                            { texts[1] }
                    </text>
                }
                <defs>
                    <mask id="myMask">
                        <rect width="100%" height="100%" fill="#fff" />
                        <text
                            id="text-1"
                            ref={(el) => this.texts[1] = el}
                            alignmentBaseline="central"
                            dominantBaseline="central" // vertical centering in firefox
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
                    alignmentBaseline="central" // vertical centering in firefox
                    dominantBaseline="central">
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