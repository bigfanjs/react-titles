import React, { Component } from "react";
import PropTypes from "prop-types";
import { TimelineMax, Power3 } from "gsap";
import isEqual from "lodash/isEqual";

class Title extends Component {
    constructor(props) {
        super(props);

        const { text1, text2, open } = this.props;

        this.texts = [];
        this.rects = [];

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

    static getDerivedStateFromProps({ open, text1, text2 }, { open: prevOpen, texts }) {
        if (open !== prevOpen) return { open: open, close: false };
        if (!isEqual([text1, text2], texts)) return { texts: [text1, text2] };

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
        const ease = Power3.easeOut;

        const rectTimeline = new TimelineMax();
        const rect2Timeline = new TimelineMax({ delay: 1 });
        const rect3Timeline = new TimelineMax({ delay: 1 });

        rectTimeline
            .from(this.rect, 1, { scaleX: 0, transformOrigin: "center", ease })
            .from(this.rect, 1, { rotation: 180, ease });

        rect2Timeline.from(this.rect2, 1, { rotation: 180, transformOrigin: "50% 0%", ease });
        rect3Timeline.from(this.rect3, 1, { rotation: 180, transformOrigin: "50% 100%", ease });

        this.timeline = new TimelineMax({ paused: true, onReverseComplete: this.handleRest });
        this.timeline.add([rectTimeline, rect2Timeline, rect3Timeline]);
    }

    handleRest = () => {
        this.setState({ close: true });
    };

    getScalesAndGaps = (bboxs) => {
        return bboxs.reduce(({ scales, gaps, widths }, { width = 0, height = 0 }) => {
            const scale = width ? this.props.size / width : 1;
            const gap = height * 0.75 * scale / 2;

            return {
                scales: [...scales, scale],
                gaps: [...gaps, gap],
                widths: [...widths, width * scale]
            };
        }, { scales: [], gaps: [], widths: [] });
    }

    render() {
        const size = this.props.size;
        const center = size / 2;
        const { texts, scales, close } = this.state;

        return (
            !close &&
            <svg width={size} height={size}>
                <defs>
                    <clipPath id="clip-path1">
                        <rect
                            ref={(el) => this.rect2 = el}
                            x={-center * 0.5}
                            y={center + 5}
                            width={size * 1.5}
                            height={center * 1.5 - 5}
                        />
                    </clipPath>
                    <clipPath id="clip-path2">
                        <rect
                            ref={(el) => this.rect3 = el}
                            x={-center * 0.5}
                            y={-center * 0.5}
                            width={size * 1.5}
                            height={center * 1.5 - 5}
                        />
                    </clipPath>
                </defs>
                <g clipPath="url(#clip-path1)">
                    <text
                        id="text-1"
                        ref={(el) => this.texts[0] = el}
                        fill="white"
                        textAnchor="middle"
                        alignmentBaseline="hanging"
                        style={{ transform: `translate(${center}px, ${center+10}px) scale(${scales[0]})` }}>
                            { texts[0] }
                    </text>
                </g>
                <g clipPath="url(#clip-path2)">
                    <text
                        id="text-2"
                        ref={(el) => this.texts[1] = el}
                        fill="white"
                        fontWeight="bold"
                        textAnchor="middle"
                        style={{ transform: `translate(${center}px, ${center-10}px) scale(${scales[1]})` }}>
                            { texts[1] }
                    </text>
                </g>
                <rect
                    ref={(el) => this.rect = el}
                    x="0"
                    y={center - 5}
                    width={size}
                    height="10"
                    fill="yellow"
                />
            </svg>
        );
    }
}

export default Title;