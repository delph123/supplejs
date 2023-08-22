import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "../utils";
import { h, Dynamic, createRef } from "../../core";

const eventTypes = [
    {
        type: "Clipboard",
        events: ["copy", "paste"],
        elementType: "input",
    },
    {
        type: "Composition",
        events: ["compositionEnd", "compositionStart", "compositionUpdate"],
        elementType: "input",
    },
    {
        type: "Keyboard",
        events: ["keyDown", "keyPress", "keyUp"],
        elementType: "input",
        init: { keyCode: 13 },
    },
    {
        type: "Focus",
        events: ["focus", "blur"],
        elementType: "input",
    },
    {
        type: "Form",
        events: ["input", "invalid", "change"],
        elementType: "input",
    },
    {
        type: "Focus",
        events: ["submit"],
        elementType: "form",
    },
    {
        type: "Mouse",
        events: [
            "click",
            "contextMenu",
            "dblClick",
            "drag",
            "dragEnd",
            "dragEnter",
            "dragExit",
            "dragLeave",
            "dragOver",
            "dragStart",
            "drop",
            "mouseDown",
            "mouseEnter",
            "mouseLeave",
            "mouseMove",
            "mouseOut",
            "mouseOver",
            "mouseUp",
        ],
        elementType: "button",
    },
    {
        type: "Pointer",
        events: [
            "pointerOver",
            "pointerEnter",
            "pointerDown",
            "pointerMove",
            "pointerUp",
            "pointerCancel",
            "pointerOut",
            "pointerLeave",
            "gotPointerCapture",
            "lostPointerCapture",
        ],
        elementType: "button",
    },
    {
        type: "Selection",
        events: ["select"],
        elementType: "input",
    },
    {
        type: "Touch",
        events: ["touchCancel", "touchEnd", "touchMove", "touchStart"],
        elementType: "button",
    },
    {
        type: "UI",
        events: ["scroll"],
        elementType: "div",
    },
    {
        type: "Wheel",
        events: ["wheel"],
        elementType: "div",
    },
    {
        type: "Media",
        events: [
            "abort",
            "canPlay",
            "canPlayThrough",
            "durationChange",
            "emptied",
            "encrypted",
            "ended",
            "error",
            "loadedData",
            "loadedMetadata",
            "loadStart",
            "pause",
            "play",
            "playing",
            "progress",
            "rateChange",
            "seeked",
            "seeking",
            "stalled",
            "suspend",
            "timeUpdate",
            "volumeChange",
            "waiting",
        ],
        elementType: "video",
    },
    {
        type: "Image",
        events: ["load", "error"],
        elementType: "img",
    },
    {
        type: "Animation",
        events: ["animationStart", "animationEnd", "animationIteration"],
        elementType: "div",
    },
    {
        type: "Transition",
        events: ["transitionEnd"],
        elementType: "div",
    },
];

eventTypes.forEach(({ type, events, elementType, init }) => {
    describe(`${type} Events`, () => {
        events.forEach((eventName) => {
            const propName = eventName.toLocaleLowerCase();
            const names = [
                `on${propName}`,
                `on:${propName}`,
                `oncapture:${propName}`,
                `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`,
            ];

            names.forEach((propName) => {
                it(`triggers ${propName}`, () => {
                    const ref = createRef();
                    const spy = vi.fn();

                    render(() => (
                        <Dynamic
                            component={elementType}
                            {...{
                                [propName]: spy,
                                ref,
                            }}
                        />
                    ));

                    fireEvent[eventName](ref.current, init);
                    expect(spy).toHaveBeenCalledTimes(1);
                });
            });
        });
    });
});
