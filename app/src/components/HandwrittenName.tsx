import { useEffect, useRef, useState } from 'react';

interface Props {
    text: string;
    className?: string;
    gradientStops?: string[];
}

const defaultStops = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'];

export default function HandwrittenName({ text, className = '', gradientStops = defaultStops }: Props) {
    const textRef = useRef<SVGTextElement>(null);
    const [pathLength, setPathLength] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 800, height: 160 });
    const [ready, setReady] = useState(false);
    const [fillVisible, setFillVisible] = useState(false);

    useEffect(() => {
        document.fonts.ready.then(() => {
            const el = textRef.current;
            if (!el) return;
            const bbox = el.getBBox();
            const pad = 10;
            setDimensions({
                width: Math.ceil(bbox.width + pad * 2),
                height: Math.ceil(bbox.height + pad * 2),
            });
            const len = el.getComputedTextLength();
            setPathLength(len);
            setReady(true);

            const drawDuration = 2500;
            setTimeout(() => setFillVisible(true), drawDuration + 200);
        });
    }, [text]);

    // Evenly space gradient stops
    const stopElements = gradientStops.map((color, i) => {
        const offset = gradientStops.length === 1 ? '50%' : `${(i / (gradientStops.length - 1)) * 100}%`;
        return <stop key={i} offset={offset} stopColor={color} />;
    });

    return (
        <div className={className}>
            <svg
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="w-full h-auto max-w-4xl mx-auto overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="name-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        {stopElements}
                    </linearGradient>
                </defs>

                {/* Hidden text for measurement */}
                {!ready && (
                    <text
                        ref={textRef}
                        x="10"
                        y={dimensions.height * 0.78}
                        fontFamily="'Pacifico', cursive"
                        fontSize="120"
                        visibility="hidden"
                    >
                        {text}
                    </text>
                )}

                {/* Stroke drawing layer */}
                {ready && (
                    <text
                        x="10"
                        y={dimensions.height * 0.78}
                        fontFamily="'Pacifico', cursive"
                        fontSize="120"
                        fill="none"
                        stroke="url(#name-gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            strokeDasharray: pathLength,
                            strokeDashoffset: pathLength,
                            animation: `pen-draw 2.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards`,
                        }}
                    >
                        {text}
                    </text>
                )}

                {/* Fill layer */}
                {ready && (
                    <text
                        x="10"
                        y={dimensions.height * 0.78}
                        fontFamily="'Pacifico', cursive"
                        fontSize="120"
                        fill="url(#name-gradient)"
                        style={{
                            opacity: fillVisible ? 1 : 0,
                            transition: 'opacity 0.8s ease',
                        }}
                    >
                        {text}
                    </text>
                )}
            </svg>
        </div>
    );
}
