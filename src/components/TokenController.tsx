import { ContextWrapper } from "./ContextWrapper.tsx";
import { CSSProperties, useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import "./token-controller.scss";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";

export const TokenController = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const [selected, setSelected] = useState<Array<string>>([]);
    const [rotation, setRotation] = useState<number>(0);
    const [angle, setAngle] = useState<number>(0);
    const [start, setStart] = useState<{ angle: number; center: { x: number; y: number } } | null>(null);
    const [lastUpdate, setLastUpdate] = useState<number>(0);
    const { isReady } = SceneReadyContext();

    const radToDeg = 180 / Math.PI;

    const style = {
        "--rotation": `${rotation}deg`,
    } as CSSProperties;

    const move = (e: MouseEvent) => {
        if (start) {
            e.preventDefault();
            const x = e.clientX - start.center.x;
            const y = e.clientY - start.center.y;
            const degrees = radToDeg * Math.atan2(y, x);
            const rotation = angle + (degrees - start.angle);
            setRotation(rotation);
        }
    };

    const stop = (e: MouseEvent) => {
        e.preventDefault();
        setAngle(angle + rotation);
        setStart(null);
    };

    const initRotate = async () => {
        if (selected.length === 1) {
            const items = await OBR.scene.items.getItems(selected);
            items.forEach((item) => {
                setRotation(item.rotation);
                setAngle(item.rotation);
            });
        }
    };

    const initTokenController = async () => {
        const selection = await OBR.player.getSelection();
        if (selection) {
            setSelected(selection);
        }
    };

    useEffect(() => {
        OBR.player.onChange(async (player) => {
            if (player.selection) {
                setSelected(player.selection);
            }
        });
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", stop);

        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", stop);
        };
    }, [start]);

    useEffect(() => {
        initRotate();
    }, [selected]);

    useEffect(() => {
        if (Date.now() - lastUpdate > 200) {
            setLastUpdate(Date.now());
            OBR.scene.items.updateItems(selected, (items) => {
                items.forEach((item) => {
                    item.rotation = rotation;
                });
            });
        }
    }, [rotation]);

    useEffect(() => {
        if (isReady) {
            initTokenController();
        }
    }, [isReady]);

    return (
        <>
            <h1>Token Controller</h1>
            {selected.length > 0 ? (
                <div className={"wheel-wrapper"}>
                    <div
                        className={"wheel"}
                        style={style}
                        onMouseDown={(e) => {
                            console.log("start");
                            e.preventDefault();
                            const rect = e.currentTarget.getBoundingClientRect();

                            const center = {
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height / 2,
                            };

                            const x = e.clientX - center.x;
                            const y = e.clientY - center.y;
                            setStart({ angle: radToDeg * Math.atan2(y, x), center: center });
                        }}
                    ></div>
                </div>
            ) : (
                "Select tokens"
            )}
        </>
    );
};
