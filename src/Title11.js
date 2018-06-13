import React, { Component } from "react";
import PropTypes from "prop-types";
import { TimelineMax, Power3 } from "gsap";
import isEqual from "lodash/isEqual";

class Title extends Component {
    constructor(props) {
        super(props);

        const { texts, open } = this.props;

        this.texts = [];
        this.rects = [];

        this.state = {
            scales: [0, 0],
            gaps: [0, 0],
            open,
            close: !open,
            texts: texts
        };

        const barWidth = 2.5;

        this.barWidth = Math.ceil(this.props.size * barWidth / 100);

        this.timeline = null;
        this.isFirefox = typeof InstallTrigger !== "undefined";
    }

    static propTypes = {
        texts: PropTypes.array,
        size: PropTypes.number
    };

    static getDerivedStateFromProps({ open, texts }, { open: prevOpen, texts: prevTexts }) {
        if (open !== prevOpen) return { open, close: false };
        if (!isEqual(texts, prevTexts)) return { texts };

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
        const bboxs = this.texts.map((text) => text.getBBox());

        const { scales, gaps } = this.getScalesAndGaps(bboxs);

        this.setState({ scales, gaps });
    }

    animate = () => {
        const gaps = this.state.gaps;
        const scales = this.state.scales;
        const ease = Power3.easeOut;

        this.timeline = new TimelineMax({ paused: true, onReverseComplete: this.handleRest });

        this.timeline
            .fromTo(
                this.texts[1],
                0.5,
                {
                    scale: scales[1],
                    x: (this.props.size * 0.5) + (this.props.size * 0.5) / 2,
                    y: gaps[1] * 3,
                    transformOrigin: "center"
                },
                { y: gaps[1] }
            )
            .fromTo(
                this.texts[0],
                0.5,
                {
                    scale: scales[0],
                    x: (this.props.size * 0.5) + (this.props.size * 0.5) / 2,
                    y: gaps[0],
                    transformOrigin: "center"
                },
                { x: (this.props.size * 0.5) / 2, ease },
                "-=0.2"
            )
            .fromTo(
                this.texts[2],
                0.5,
                {
                    scale: scales[2],
                    x: (this.props.size * 0.5) + (this.props.size * 0.5) / 2,
                    y: gaps[1] * 2 + gaps[0],
                    transformOrigin: "center"
                },
            { y: gaps[1] * 2 + gaps[2], ease },
                "-=0.5"
            );
    }

    handleRest = () => {
        this.setState({ close: true });
    };

    getScalesAndGaps = (bboxs) => {
        return bboxs.reduce(({ scales, gaps }, { width = 0, height = 0 }) => {
            const scale = width ? this.props.size * 0.5 / width : 1;
            const gap = height * 0.75 * scale / 2;

            return {
                scales: [...scales, scale],
                gaps: [...gaps, gap]
            };
        }, { scales: [], gaps: [] });
    }

    render() {
        const size = this.props.size;
        const center = size / 2;
        const { texts, gaps, close } = this.state;
        const height = Math.min((gaps[1] + gaps[0]) * 2, size);

        return (
            !close &&
            <svg style={{ border: "1px solid" }} width={size} height={height}>
                <defs>
                    {/* <clipPath id="clip1">
                        <rect
                            ref={(el) => this.rects[2] = el}
                            width={size}
                            height={gaps[1] * 2}
                        />
                    </clipPath> */}
                    {/* <clipPath id="clip2">
                        <rect x="0" y={gaps[1] * 2} width={center} height={gaps[0] * 2} />
                    </clipPath>
                    <clipPath id="clip3">
                        <rect x={center} y={gaps[1] * 2} width={center} height={gaps[0] * 2} />
                    </clipPath> */}
                </defs>
                <g clipPath="url(#clip2)">
                    <text
                        id="text-1"
                        ref={(el) => this.texts[0] = el}
                        fill="white"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="central" // vertical centering in firefox
                        dominantBaseline="central">
                            { texts[0] }
                    </text>
                </g>
                <g clipPath="url(#clip3)">
                    <text
                        id="text-3"
                        ref={(el) => this.texts[1] = el}
                        fill="white"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="central" // vertical centering in firefox
                        dominantBaseline="central">
                            { texts[1] }
                    </text>
                </g>
                <g clipPath="url(#clip1)">
                    {   this.isFirefox &&
                        <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
                    }
                    <text
                        id="text-2"
                        ref={(el) => this.texts[2] = el}
                        fill="white"
                        alignmentBaseline="central"
                        dominantBaseline="central" // vertical centering in firefox
                        fontWeight="bold"
                        textAnchor="middle">
                            { texts[2] }
                    </text>
                </g>
                <rect
                    opacity="0.3"
                    ref={(el) => this.rects[2] = el}
                    width={size * 0.5}
                    height={gaps[0] * 2}
                    fill="rgb(255, 0, 0)"
                />
            </svg>
        );
    }
}

export default Title;