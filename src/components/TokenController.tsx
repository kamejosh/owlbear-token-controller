import { ContextWrapper } from "./ContextWrapper.tsx";
import {
    CSSProperties,
    useEffect,
    useState,
    MouseEvent as ReactMouseEvent,
    TouchEvent as ReactTouchEvent,
} from "react";
import OBR, { InteractionManager, Item } from "@owlbear-rodeo/sdk";
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
    const [interaction, setInteraction] = useState<InteractionManager<Array<Item>> | null>(null);
    const { isReady } = SceneReadyContext();

    const radToDeg = 180 / Math.PI;

    const style = {
        "--rotation": `${rotation}deg`,
    } as CSSProperties;

    const startMove = async (e: ReactMouseEvent<HTMLDivElement, MouseEvent> | ReactTouchEvent<HTMLDivElement>) => {
        const items = await OBR.scene.items.getItems(selected);
        setInteraction(await OBR.interaction.startItemInteraction(items));
        e.preventDefault();
        const rect = (e.target as HTMLDivElement).getBoundingClientRect();

        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
        let x, y: number;
        if ("touches" in e) {
            x = e.touches[0].clientX - center.x;
            y = e.touches[0].clientY - center.y;
        } else {
            x = e.clientX - center.x;
            y = e.clientY - center.y;
        }
        setStart({ angle: radToDeg * Math.atan2(y, x), center: center });
    };

    const move = async (e: MouseEvent | TouchEvent) => {
        if (start) {
            e.preventDefault();
            let x, y: number;
            if ("touches" in e) {
                x = e.touches[0].clientX - start.center.x;
                y = e.touches[0].clientY - start.center.y;
            } else {
                x = e.clientX - start.center.x;
                y = e.clientY - start.center.y;
            }
            const degrees = radToDeg * Math.atan2(y, x);
            const rotation = angle + (degrees - start.angle);
            if (interaction) {
                const [update] = interaction;
                update((items) => {
                    items.forEach((item) => {
                        item.rotation = rotation;
                    });
                });
            }
            setRotation(rotation);
        }
    };

    const stop = async (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        setAngle(angle + rotation);
        setStart(null);
        if (interaction) {
            const [_, stop] = interaction;
            stop();
            await OBR.scene.items.updateItems(selected, (items) => {
                items.forEach((item) => {
                    item.rotation = rotation;
                });
            });
        }
        setInteraction(null);
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

    const rotateToken = async () => {};

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
        window.addEventListener("touchmove", move);
        window.addEventListener("touchend", stop);

        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", stop);
            window.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", stop);
        };
    }, [start]);

    useEffect(() => {
        initRotate();
    }, [selected]);

    useEffect(() => {
        rotateToken();
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
                        onMouseDown={(e) => startMove(e)}
                        onTouchStart={(e) => startMove(e)}
                    ></div>
                </div>
            ) : (
                "Select tokens"
            )}
        </>
    );
};
