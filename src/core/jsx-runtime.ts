import { Properties, PropertiesHyphen } from "csstype";
import { Accessor, Ref, SuppleNode } from "./types";

/**
 * Based on JSX types for Solid and `@ryansolid/dom-expressions` and modified for SuppleJS.
 *
 * https://github.com/ryansolid/dom-expressions/blob/main/packages/dom-expressions/src/jsx.d.ts
 *
 * @module
 */

type DOMElement = Element;
type Booleanish = boolean | "true" | "false";
type AttributeAccessor<T> = T | null | undefined | Accessor<T | null | undefined>;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        export type Element = SuppleNode;

        export interface ElementClass {
            // exposed for React compatibility as there is no class component in SuppleJS
        }

        export interface ElementAttributesProperty {
            props: Record<string, unknown>;
        }

        export interface ElementChildrenAttribute {
            children: unknown;
        }

        type EventHandler<T, E extends Event> = (
            e: E & {
                currentTarget: T;
                target: DOMElement;
            },
        ) => void;
        interface BoundEventHandler<T, E extends Event> {
            0: (
                data: any,
                e: E & {
                    currentTarget: T;
                    target: DOMElement;
                },
            ) => void;
            1: any;
        }
        type EventHandlerUnion<T, E extends Event> = EventHandler<T, E> | BoundEventHandler<T, E>;

        type TargetElement<T> = T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            ? T
            : DOMElement;

        type InputEventHandler<T, E extends InputEvent> = (
            e: E & {
                currentTarget: T;
                target: TargetElement<T>;
            },
        ) => void;
        interface BoundInputEventHandler<T, E extends InputEvent> {
            0: (
                data: any,
                e: E & {
                    currentTarget: T;
                    target: TargetElement<T>;
                },
            ) => void;
            1: any;
        }
        type InputEventHandlerUnion<T, E extends InputEvent> =
            | InputEventHandler<T, E>
            | BoundInputEventHandler<T, E>;

        type ChangeEventHandler<T, E extends Event> = (
            e: E & {
                currentTarget: T;
                target: TargetElement<T>;
            },
        ) => void;
        interface BoundChangeEventHandler<T, E extends Event> {
            0: (
                data: any,
                e: E & {
                    currentTarget: T;
                    target: TargetElement<T>;
                },
            ) => void;
            1: any;
        }
        type ChangeEventHandlerUnion<T, E extends Event> =
            | ChangeEventHandler<T, E>
            | BoundChangeEventHandler<T, E>;

        type FocusEventHandler<T, E extends FocusEvent> = (
            e: E & {
                currentTarget: T;
                target: TargetElement<T>;
            },
        ) => void;
        interface BoundFocusEventHandler<T, E extends FocusEvent> {
            0: (
                data: any,
                e: E & {
                    currentTarget: T;
                    target: TargetElement<T>;
                },
            ) => void;
            1: any;
        }
        type FocusEventHandlerUnion<T, E extends FocusEvent> =
            | FocusEventHandler<T, E>
            | BoundFocusEventHandler<T, E>;

        const SERIALIZABLE: unique symbol;
        interface SerializableAttributeValue {
            toString(): string;
            [SERIALIZABLE]: never;
        }

        export interface IntrinsicAttributes {
            // no used
        }

        export interface IntrinsicClassAttributes extends IntrinsicAttributes {}

        interface CustomAttributes<T> {
            ref?: Ref<T> | null;
            classList?: AttributeAccessor<{
                [k: string]: boolean | undefined;
            }>;
        }
        export interface Directives {}
        interface DirectiveFunctions {
            [x: string]: (el: DOMElement, accessor: Accessor<any>) => void;
        }
        export interface ExplicitProperties {}
        export interface ExplicitAttributes {}
        export interface CustomEvents {}
        export interface CustomCaptureEvents {}
        type DirectiveAttributes = {
            [Key in keyof Directives as `use:${Key}`]?: Directives[Key];
        };
        type DirectiveFunctionAttributes<T> = {
            [K in keyof DirectiveFunctions as string extends K
                ? never
                : `use:${K}`]?: DirectiveFunctions[K] extends (
                el: infer E, // will be unknown if not provided
                ...rest: infer R // use rest so that we can check whether it's provided or not
            ) => void
                ? T extends E // everything extends unknown if E is unknown
                    ? R extends [infer A] // check if has accessor provided
                        ? A extends Accessor<infer V>
                            ? V // it's an accessor
                            : never // it isn't, type error
                        : true // no accessor provided
                    : never // T is the wrong element
                : never; // it isn't a function
        };
        type PropAttributes = {
            [Key in keyof ExplicitProperties as `prop:${Key}`]?: AttributeAccessor<ExplicitProperties[Key]>;
        };
        type AttrAttributes = {
            [Key in keyof ExplicitAttributes as `attr:${Key}`]?: AttributeAccessor<ExplicitAttributes[Key]>;
        };
        type OnAttributes<T> = {
            [Key in keyof CustomEvents as `on:${Key}`]?: EventHandler<T, CustomEvents[Key]>;
        };
        type OnCaptureAttributes<T> = {
            [Key in keyof CustomCaptureEvents as `oncapture:${Key}`]?: EventHandler<
                T,
                CustomCaptureEvents[Key]
            >;
        };
        interface DOMAttributes<T>
            extends CustomAttributes<T>,
                DirectiveAttributes,
                DirectiveFunctionAttributes<T>,
                PropAttributes,
                AttrAttributes,
                OnAttributes<T>,
                OnCaptureAttributes<T>,
                CustomEventHandlersCamelCase<T>,
                CustomEventHandlersLowerCase<T> {
            children?: Element;
            innerHTML?: AttributeAccessor<string>;
            innerText?: AttributeAccessor<string | number>;
            textContent?: AttributeAccessor<string | number>;
            // camel case events
            onCopy?: EventHandlerUnion<T, ClipboardEvent>;
            onCut?: EventHandlerUnion<T, ClipboardEvent>;
            onPaste?: EventHandlerUnion<T, ClipboardEvent>;
            onCompositionEnd?: EventHandlerUnion<T, CompositionEvent>;
            onCompositionStart?: EventHandlerUnion<T, CompositionEvent>;
            onCompositionUpdate?: EventHandlerUnion<T, CompositionEvent>;
            onFocusOut?: FocusEventHandlerUnion<T, FocusEvent>;
            onFocusIn?: FocusEventHandlerUnion<T, FocusEvent>;
            onEncrypted?: EventHandlerUnion<T, Event>;
            onDragExit?: EventHandlerUnion<T, DragEvent>;
            // lower case events
            oncopy?: EventHandlerUnion<T, ClipboardEvent>;
            oncut?: EventHandlerUnion<T, ClipboardEvent>;
            onpaste?: EventHandlerUnion<T, ClipboardEvent>;
            oncompositionend?: EventHandlerUnion<T, CompositionEvent>;
            oncompositionstart?: EventHandlerUnion<T, CompositionEvent>;
            oncompositionupdate?: EventHandlerUnion<T, CompositionEvent>;
            onfocusout?: FocusEventHandlerUnion<T, FocusEvent>;
            onfocusin?: FocusEventHandlerUnion<T, FocusEvent>;
            onencrypted?: EventHandlerUnion<T, Event>;
            ondragexit?: EventHandlerUnion<T, DragEvent>;
        }
        interface CustomEventHandlersCamelCase<T> {
            onAbort?: EventHandlerUnion<T, Event>;
            onAnimationEnd?: EventHandlerUnion<T, AnimationEvent>;
            onAnimationIteration?: EventHandlerUnion<T, AnimationEvent>;
            onAnimationStart?: EventHandlerUnion<T, AnimationEvent>;
            onAuxClick?: EventHandlerUnion<T, MouseEvent>;
            onBeforeInput?: InputEventHandlerUnion<T, InputEvent>;
            onBeforeToggle?: EventHandlerUnion<T, ToggleEvent>;
            onBlur?: FocusEventHandlerUnion<T, FocusEvent>;
            onCanPlay?: EventHandlerUnion<T, Event>;
            onCanPlayThrough?: EventHandlerUnion<T, Event>;
            onChange?: ChangeEventHandlerUnion<T, Event>;
            onClick?: EventHandlerUnion<T, MouseEvent>;
            onContextMenu?: EventHandlerUnion<T, MouseEvent>;
            onDblClick?: EventHandlerUnion<T, MouseEvent>;
            onDrag?: EventHandlerUnion<T, DragEvent>;
            onDragEnd?: EventHandlerUnion<T, DragEvent>;
            onDragEnter?: EventHandlerUnion<T, DragEvent>;
            onDragLeave?: EventHandlerUnion<T, DragEvent>;
            onDragOver?: EventHandlerUnion<T, DragEvent>;
            onDragStart?: EventHandlerUnion<T, DragEvent>;
            onDrop?: EventHandlerUnion<T, DragEvent>;
            onDurationChange?: EventHandlerUnion<T, Event>;
            onEmptied?: EventHandlerUnion<T, Event>;
            onEnded?: EventHandlerUnion<T, Event>;
            onError?: EventHandlerUnion<T, Event>;
            onFocus?: FocusEventHandlerUnion<T, FocusEvent>;
            onGotPointerCapture?: EventHandlerUnion<T, PointerEvent>;
            onInput?: InputEventHandlerUnion<T, InputEvent>;
            onInvalid?: EventHandlerUnion<T, Event>;
            onKeyDown?: EventHandlerUnion<T, KeyboardEvent>;
            onKeyPress?: EventHandlerUnion<T, KeyboardEvent>;
            onKeyUp?: EventHandlerUnion<T, KeyboardEvent>;
            onLoad?: EventHandlerUnion<T, Event>;
            onLoadedData?: EventHandlerUnion<T, Event>;
            onLoadedMetadata?: EventHandlerUnion<T, Event>;
            onLoadStart?: EventHandlerUnion<T, Event>;
            onLostPointerCapture?: EventHandlerUnion<T, PointerEvent>;
            onMouseDown?: EventHandlerUnion<T, MouseEvent>;
            onMouseEnter?: EventHandlerUnion<T, MouseEvent>;
            onMouseLeave?: EventHandlerUnion<T, MouseEvent>;
            onMouseMove?: EventHandlerUnion<T, MouseEvent>;
            onMouseOut?: EventHandlerUnion<T, MouseEvent>;
            onMouseOver?: EventHandlerUnion<T, MouseEvent>;
            onMouseUp?: EventHandlerUnion<T, MouseEvent>;
            onPause?: EventHandlerUnion<T, Event>;
            onPlay?: EventHandlerUnion<T, Event>;
            onPlaying?: EventHandlerUnion<T, Event>;
            onPointerCancel?: EventHandlerUnion<T, PointerEvent>;
            onPointerDown?: EventHandlerUnion<T, PointerEvent>;
            onPointerEnter?: EventHandlerUnion<T, PointerEvent>;
            onPointerLeave?: EventHandlerUnion<T, PointerEvent>;
            onPointerMove?: EventHandlerUnion<T, PointerEvent>;
            onPointerOut?: EventHandlerUnion<T, PointerEvent>;
            onPointerOver?: EventHandlerUnion<T, PointerEvent>;
            onPointerUp?: EventHandlerUnion<T, PointerEvent>;
            onProgress?: EventHandlerUnion<T, Event>;
            onRateChange?: EventHandlerUnion<T, Event>;
            onReset?: EventHandlerUnion<T, Event>;
            onScroll?: EventHandlerUnion<T, Event>;
            onScrollEnd?: EventHandlerUnion<T, Event>;
            onSeeked?: EventHandlerUnion<T, Event>;
            onSeeking?: EventHandlerUnion<T, Event>;
            onSelect?: EventHandlerUnion<T, UIEvent>;
            onStalled?: EventHandlerUnion<T, Event>;
            onSubmit?: EventHandlerUnion<
                T,
                Event & {
                    submitter: HTMLElement;
                }
            >;
            onSuspend?: EventHandlerUnion<T, Event>;
            onTimeUpdate?: EventHandlerUnion<T, Event>;
            onToggle?: EventHandlerUnion<T, ToggleEvent>;
            onTouchCancel?: EventHandlerUnion<T, TouchEvent>;
            onTouchEnd?: EventHandlerUnion<T, TouchEvent>;
            onTouchMove?: EventHandlerUnion<T, TouchEvent>;
            onTouchStart?: EventHandlerUnion<T, TouchEvent>;
            onTransitionStart?: EventHandlerUnion<T, TransitionEvent>;
            onTransitionEnd?: EventHandlerUnion<T, TransitionEvent>;
            onTransitionRun?: EventHandlerUnion<T, TransitionEvent>;
            onTransitionCancel?: EventHandlerUnion<T, TransitionEvent>;
            onVolumeChange?: EventHandlerUnion<T, Event>;
            onWaiting?: EventHandlerUnion<T, Event>;
            onWheel?: EventHandlerUnion<T, WheelEvent>;
        }
        /**
         * @type {GlobalEventHandlers}
         */
        interface CustomEventHandlersLowerCase<T> {
            onabort?: EventHandlerUnion<T, Event>;
            onanimationend?: EventHandlerUnion<T, AnimationEvent>;
            onanimationiteration?: EventHandlerUnion<T, AnimationEvent>;
            onanimationstart?: EventHandlerUnion<T, AnimationEvent>;
            onauxclick?: EventHandlerUnion<T, MouseEvent>;
            onbeforeinput?: InputEventHandlerUnion<T, InputEvent>;
            onbeforetoggle?: EventHandlerUnion<T, ToggleEvent>;
            onblur?: FocusEventHandlerUnion<T, FocusEvent>;
            oncanplay?: EventHandlerUnion<T, Event>;
            oncanplaythrough?: EventHandlerUnion<T, Event>;
            onchange?: ChangeEventHandlerUnion<T, Event>;
            onclick?: EventHandlerUnion<T, MouseEvent>;
            oncontextmenu?: EventHandlerUnion<T, MouseEvent>;
            ondblclick?: EventHandlerUnion<T, MouseEvent>;
            ondrag?: EventHandlerUnion<T, DragEvent>;
            ondragend?: EventHandlerUnion<T, DragEvent>;
            ondragenter?: EventHandlerUnion<T, DragEvent>;
            ondragleave?: EventHandlerUnion<T, DragEvent>;
            ondragover?: EventHandlerUnion<T, DragEvent>;
            ondragstart?: EventHandlerUnion<T, DragEvent>;
            ondrop?: EventHandlerUnion<T, DragEvent>;
            ondurationchange?: EventHandlerUnion<T, Event>;
            onemptied?: EventHandlerUnion<T, Event>;
            onended?: EventHandlerUnion<T, Event>;
            onerror?: EventHandlerUnion<T, Event>;
            onfocus?: FocusEventHandlerUnion<T, FocusEvent>;
            ongotpointercapture?: EventHandlerUnion<T, PointerEvent>;
            oninput?: InputEventHandlerUnion<T, InputEvent>;
            oninvalid?: EventHandlerUnion<T, Event>;
            onkeydown?: EventHandlerUnion<T, KeyboardEvent>;
            onkeypress?: EventHandlerUnion<T, KeyboardEvent>;
            onkeyup?: EventHandlerUnion<T, KeyboardEvent>;
            onload?: EventHandlerUnion<T, Event>;
            onloadeddata?: EventHandlerUnion<T, Event>;
            onloadedmetadata?: EventHandlerUnion<T, Event>;
            onloadstart?: EventHandlerUnion<T, Event>;
            onlostpointercapture?: EventHandlerUnion<T, PointerEvent>;
            onmousedown?: EventHandlerUnion<T, MouseEvent>;
            onmouseenter?: EventHandlerUnion<T, MouseEvent>;
            onmouseleave?: EventHandlerUnion<T, MouseEvent>;
            onmousemove?: EventHandlerUnion<T, MouseEvent>;
            onmouseout?: EventHandlerUnion<T, MouseEvent>;
            onmouseover?: EventHandlerUnion<T, MouseEvent>;
            onmouseup?: EventHandlerUnion<T, MouseEvent>;
            onpause?: EventHandlerUnion<T, Event>;
            onplay?: EventHandlerUnion<T, Event>;
            onplaying?: EventHandlerUnion<T, Event>;
            onpointercancel?: EventHandlerUnion<T, PointerEvent>;
            onpointerdown?: EventHandlerUnion<T, PointerEvent>;
            onpointerenter?: EventHandlerUnion<T, PointerEvent>;
            onpointerleave?: EventHandlerUnion<T, PointerEvent>;
            onpointermove?: EventHandlerUnion<T, PointerEvent>;
            onpointerout?: EventHandlerUnion<T, PointerEvent>;
            onpointerover?: EventHandlerUnion<T, PointerEvent>;
            onpointerup?: EventHandlerUnion<T, PointerEvent>;
            onprogress?: EventHandlerUnion<T, Event>;
            onratechange?: EventHandlerUnion<T, Event>;
            onreset?: EventHandlerUnion<T, Event>;
            onscroll?: EventHandlerUnion<T, Event>;
            onscrollend?: EventHandlerUnion<T, Event>;
            onseeked?: EventHandlerUnion<T, Event>;
            onseeking?: EventHandlerUnion<T, Event>;
            onselect?: EventHandlerUnion<T, UIEvent>;
            onstalled?: EventHandlerUnion<T, Event>;
            onsubmit?: EventHandlerUnion<
                T,
                Event & {
                    submitter: HTMLElement;
                }
            >;
            onsuspend?: EventHandlerUnion<T, Event>;
            ontimeupdate?: EventHandlerUnion<T, Event>;
            ontoggle?: EventHandlerUnion<T, ToggleEvent>;
            ontouchcancel?: EventHandlerUnion<T, TouchEvent>;
            ontouchend?: EventHandlerUnion<T, TouchEvent>;
            ontouchmove?: EventHandlerUnion<T, TouchEvent>;
            ontouchstart?: EventHandlerUnion<T, TouchEvent>;
            ontransitionstart?: EventHandlerUnion<T, TransitionEvent>;
            ontransitionend?: EventHandlerUnion<T, TransitionEvent>;
            ontransitionrun?: EventHandlerUnion<T, TransitionEvent>;
            ontransitioncancel?: EventHandlerUnion<T, TransitionEvent>;
            onvolumechange?: EventHandlerUnion<T, Event>;
            onwaiting?: EventHandlerUnion<T, Event>;
            onwheel?: EventHandlerUnion<T, WheelEvent>;
        }

        interface CSSProperties extends Properties, PropertiesHyphen {
            // Overrides & CSS variables
            [key: `-${string}`]: string | number | undefined;
        }

        type HTMLAutocapitalize = "off" | "none" | "on" | "sentences" | "words" | "characters";
        type HTMLDir = "ltr" | "rtl" | "auto";
        type HTMLFormEncType = "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
        type HTMLFormMethod = "post" | "get" | "dialog";
        type HTMLCrossorigin = "anonymous" | "use-credentials" | "";
        type HTMLReferrerPolicy =
            | "no-referrer"
            | "no-referrer-when-downgrade"
            | "origin"
            | "origin-when-cross-origin"
            | "same-origin"
            | "strict-origin"
            | "strict-origin-when-cross-origin"
            | "unsafe-url";
        type HTMLIframeSandbox =
            | "allow-downloads-without-user-activation"
            | "allow-downloads"
            | "allow-forms"
            | "allow-modals"
            | "allow-orientation-lock"
            | "allow-pointer-lock"
            | "allow-popups"
            | "allow-popups-to-escape-sandbox"
            | "allow-presentation"
            | "allow-same-origin"
            | "allow-scripts"
            | "allow-storage-access-by-user-activation"
            | "allow-top-navigation"
            | "allow-top-navigation-by-user-activation"
            | "allow-top-navigation-to-custom-protocols";
        type HTMLLinkAs =
            | "audio"
            | "document"
            | "embed"
            | "fetch"
            | "font"
            | "image"
            | "object"
            | "script"
            | "style"
            | "track"
            | "video"
            | "worker";

        // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
        interface AriaAttributes {
            /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
            "aria-activedescendant"?: AttributeAccessor<string>;
            /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
            "aria-atomic"?: AttributeAccessor<Booleanish>;
            /**
             * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
             * presented if they are made.
             */
            "aria-autocomplete"?: AttributeAccessor<"none" | "inline" | "list" | "both">;
            /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
            "aria-busy"?: AttributeAccessor<Booleanish>;
            /**
             * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
             * @see aria-pressed @see aria-selected.
             */
            "aria-checked"?: AttributeAccessor<boolean | "false" | "mixed" | "true">;
            /**
             * Defines the total number of columns in a table, grid, or treegrid.
             * @see aria-colindex.
             */
            "aria-colcount"?: AttributeAccessor<number | string>;
            /**
             * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
             * @see aria-colcount @see aria-colspan.
             */
            "aria-colindex"?: AttributeAccessor<number | string>;
            /**
             * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
             * @see aria-colindex @see aria-rowspan.
             */
            "aria-colspan"?: AttributeAccessor<number | string>;
            /**
             * Identifies the element (or elements) whose contents or presence are controlled by the current element.
             * @see aria-owns.
             */
            "aria-controls"?: AttributeAccessor<string>;
            /** Indicates the element that represents the current item within a container or set of related elements. */
            "aria-current"?: AttributeAccessor<Booleanish | "page" | "step" | "location" | "date" | "time">;
            /**
             * Identifies the element (or elements) that describes the object.
             * @see aria-labelledby
             */
            "aria-describedby"?: AttributeAccessor<string>;
            /**
             * Identifies the element that provides a detailed, extended description for the object.
             * @see aria-describedby.
             */
            "aria-details"?: AttributeAccessor<string>;
            /**
             * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
             * @see aria-hidden @see aria-readonly.
             */
            "aria-disabled"?: AttributeAccessor<Booleanish>;
            /**
             * Indicates what functions can be performed when a dragged object is released on the drop target.
             * @deprecated in ARIA 1.1
             */
            "aria-dropeffect"?: AttributeAccessor<"none" | "copy" | "execute" | "link" | "move" | "popup">;
            /**
             * Identifies the element that provides an error message for the object.
             * @see aria-invalid @see aria-describedby.
             */
            "aria-errormessage"?: AttributeAccessor<string>;
            /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
            "aria-expanded"?: AttributeAccessor<Booleanish>;
            /**
             * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
             * allows assistive technology to override the general default of reading in document source order.
             */
            "aria-flowto"?: AttributeAccessor<string>;
            /**
             * Indicates an element's "grabbed" state in a drag-and-drop operation.
             * @deprecated in ARIA 1.1
             */
            "aria-grabbed"?: AttributeAccessor<Booleanish>;
            /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
            "aria-haspopup"?: AttributeAccessor<Booleanish | "menu" | "listbox" | "tree" | "grid" | "dialog">;
            /**
             * Indicates whether the element is exposed to an accessibility API.
             * @see aria-disabled.
             */
            "aria-hidden"?: AttributeAccessor<Booleanish>;
            /**
             * Indicates the entered value does not conform to the format expected by the application.
             * @see aria-errormessage.
             */
            "aria-invalid"?: AttributeAccessor<Booleanish | "grammar" | "spelling">;
            /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
            "aria-keyshortcuts"?: AttributeAccessor<string>;
            /**
             * Defines a string value that labels the current element.
             * @see aria-labelledby.
             */
            "aria-label"?: AttributeAccessor<string>;
            /**
             * Identifies the element (or elements) that labels the current element.
             * @see aria-describedby.
             */
            "aria-labelledby"?: AttributeAccessor<string>;
            /** Defines the hierarchical level of an element within a structure. */
            "aria-level"?: AttributeAccessor<number | string>;
            /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
            "aria-live"?: AttributeAccessor<"off" | "assertive" | "polite">;
            /** Indicates whether an element is modal when displayed. */
            "aria-modal"?: AttributeAccessor<Booleanish>;
            /** Indicates whether a text box accepts multiple lines of input or only a single line. */
            "aria-multiline"?: AttributeAccessor<Booleanish>;
            /** Indicates that the user may select more than one item from the current selectable descendants. */
            "aria-multiselectable"?: AttributeAccessor<Booleanish>;
            /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
            "aria-orientation"?: AttributeAccessor<"horizontal" | "vertical">;
            /**
             * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
             * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
             * @see aria-controls.
             */
            "aria-owns"?: AttributeAccessor<string>;
            /**
             * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
             * A hint could be a sample value or a brief description of the expected format.
             */
            "aria-placeholder"?: AttributeAccessor<string>;
            /**
             * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
             * @see aria-setsize.
             */
            "aria-posinset"?: AttributeAccessor<number | string>;
            /**
             * Indicates the current "pressed" state of toggle buttons.
             * @see aria-checked @see aria-selected.
             */
            "aria-pressed"?: AttributeAccessor<boolean | "false" | "mixed" | "true">;
            /**
             * Indicates that the element is not editable, but is otherwise operable.
             * @see aria-disabled.
             */
            "aria-readonly"?: AttributeAccessor<Booleanish>;
            /**
             * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
             * @see aria-atomic.
             */
            "aria-relevant"?: AttributeAccessor<
                | "additions"
                | "additions removals"
                | "additions text"
                | "all"
                | "removals"
                | "removals additions"
                | "removals text"
                | "text"
                | "text additions"
                | "text removals"
            >;
            /** Indicates that user input is required on the element before a form may be submitted. */
            "aria-required"?: AttributeAccessor<Booleanish>;
            /** Defines a human-readable, author-localized description for the role of an element. */
            "aria-roledescription"?: AttributeAccessor<string>;
            /**
             * Defines the total number of rows in a table, grid, or treegrid.
             * @see aria-rowindex.
             */
            "aria-rowcount"?: AttributeAccessor<number | string>;
            /**
             * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
             * @see aria-rowcount @see aria-rowspan.
             */
            "aria-rowindex"?: AttributeAccessor<number | string>;
            /**
             * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
             * @see aria-rowindex @see aria-colspan.
             */
            "aria-rowspan"?: AttributeAccessor<number | string>;
            /**
             * Indicates the current "selected" state of various widgets.
             * @see aria-checked @see aria-pressed.
             */
            "aria-selected"?: AttributeAccessor<Booleanish>;
            /**
             * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
             * @see aria-posinset.
             */
            "aria-setsize"?: AttributeAccessor<number | string>;
            /** Indicates if items in a table or grid are sorted in ascending or descending order. */
            "aria-sort"?: AttributeAccessor<"none" | "ascending" | "descending" | "other">;
            /** Defines the maximum allowed value for a range widget. */
            "aria-valuemax"?: AttributeAccessor<number | string>;
            /** Defines the minimum allowed value for a range widget. */
            "aria-valuemin"?: AttributeAccessor<number | string>;
            /**
             * Defines the current value for a range widget.
             * @see aria-valuetext.
             */
            "aria-valuenow"?: AttributeAccessor<number | string>;
            /** Defines the human readable text alternative of aria-valuenow for a range widget. */
            "aria-valuetext"?: AttributeAccessor<string>;
            role?: AttributeAccessor<
                | "alert"
                | "alertdialog"
                | "application"
                | "article"
                | "banner"
                | "button"
                | "cell"
                | "checkbox"
                | "columnheader"
                | "combobox"
                | "complementary"
                | "contentinfo"
                | "definition"
                | "dialog"
                | "directory"
                | "document"
                | "feed"
                | "figure"
                | "form"
                | "grid"
                | "gridcell"
                | "group"
                | "heading"
                | "img"
                | "link"
                | "list"
                | "listbox"
                | "listitem"
                | "log"
                | "main"
                | "marquee"
                | "math"
                | "menu"
                | "menubar"
                | "menuitem"
                | "menuitemcheckbox"
                | "menuitemradio"
                | "meter"
                | "navigation"
                | "none"
                | "note"
                | "option"
                | "presentation"
                | "progressbar"
                | "radio"
                | "radiogroup"
                | "region"
                | "row"
                | "rowgroup"
                | "rowheader"
                | "scrollbar"
                | "search"
                | "searchbox"
                | "separator"
                | "slider"
                | "spinbutton"
                | "status"
                | "switch"
                | "tab"
                | "table"
                | "tablist"
                | "tabpanel"
                | "term"
                | "textbox"
                | "timer"
                | "toolbar"
                | "tooltip"
                | "tree"
                | "treegrid"
                | "treeitem"
                | string
            >;
        }

        interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
            accessKey?: AttributeAccessor<string>;
            class?: AttributeAccessor<string>;
            className?: AttributeAccessor<string>;
            contenteditable?: AttributeAccessor<boolean | "plaintext-only" | "inherit">;
            contextmenu?: AttributeAccessor<string>;
            dir?: AttributeAccessor<HTMLDir>;
            draggable?: AttributeAccessor<boolean>;
            hidden?: AttributeAccessor<boolean | "hidden" | "until-found">;
            id?: AttributeAccessor<string>;
            inert?: AttributeAccessor<boolean>;
            lang?: AttributeAccessor<string>;
            spellcheck?: AttributeAccessor<boolean>;
            style?: AttributeAccessor<CSSProperties | string>;
            tabindex?: AttributeAccessor<number | string>;
            title?: AttributeAccessor<string>;
            translate?: AttributeAccessor<"yes" | "no">;
            about?: AttributeAccessor<string>;
            datatype?: AttributeAccessor<string>;
            inlist?: AttributeAccessor<any>;
            popover?: AttributeAccessor<boolean | "manual" | "auto">;
            prefix?: AttributeAccessor<string>;
            property?: AttributeAccessor<string>;
            resource?: AttributeAccessor<string>;
            typeof?: AttributeAccessor<string>;
            vocab?: AttributeAccessor<string>;
            autocapitalize?: AttributeAccessor<HTMLAutocapitalize>;
            slot?: AttributeAccessor<string>;
            color?: AttributeAccessor<string>;
            itemprop?: AttributeAccessor<string>;
            itemscope?: AttributeAccessor<boolean>;
            itemtype?: AttributeAccessor<string>;
            itemid?: AttributeAccessor<string>;
            itemref?: AttributeAccessor<string>;
            part?: AttributeAccessor<string>;
            exportparts?: AttributeAccessor<string>;
            inputmode?: AttributeAccessor<
                "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search"
            >;
            contentEditable?: AttributeAccessor<boolean | "plaintext-only" | "inherit">;
            contextMenu?: AttributeAccessor<string>;
            tabIndex?: AttributeAccessor<number | string>;
            autoCapitalize?: AttributeAccessor<HTMLAutocapitalize>;
            itemProp?: AttributeAccessor<string>;
            itemScope?: AttributeAccessor<boolean>;
            itemType?: AttributeAccessor<string>;
            itemId?: AttributeAccessor<string>;
            itemRef?: AttributeAccessor<string>;
            exportParts?: AttributeAccessor<string>;
            inputMode?: AttributeAccessor<
                "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search"
            >;
        }
        interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
            download?: AttributeAccessor<any>;
            href?: AttributeAccessor<string>;
            hreflang?: AttributeAccessor<string>;
            media?: AttributeAccessor<string>;
            ping?: AttributeAccessor<string>;
            referrerpolicy?: AttributeAccessor<HTMLReferrerPolicy>;
            rel?: AttributeAccessor<string>;
            target?: AttributeAccessor<string>;
            type?: AttributeAccessor<string>;
            referrerPolicy?: AttributeAccessor<HTMLReferrerPolicy>;
        }
        interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}
        interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
            alt?: AttributeAccessor<string>;
            coords?: AttributeAccessor<string>;
            download?: AttributeAccessor<any>;
            href?: AttributeAccessor<string>;
            hreflang?: AttributeAccessor<string>;
            ping?: AttributeAccessor<string>;
            referrerpolicy?: AttributeAccessor<HTMLReferrerPolicy>;
            rel?: AttributeAccessor<string>;
            shape?: AttributeAccessor<"rect" | "circle" | "poly" | "default">;
            target?: AttributeAccessor<string>;
            referrerPolicy?: AttributeAccessor<HTMLReferrerPolicy>;
        }
        interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
            href?: AttributeAccessor<string>;
            target?: AttributeAccessor<string>;
        }
        interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
            cite?: AttributeAccessor<string>;
        }
        interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
            autofocus?: AttributeAccessor<boolean>;
            disabled?: AttributeAccessor<boolean>;
            form?: AttributeAccessor<string>;
            formaction?: AttributeAccessor<string | SerializableAttributeValue>;
            formenctype?: AttributeAccessor<HTMLFormEncType>;
            formmethod?: AttributeAccessor<HTMLFormMethod>;
            formnovalidate?: AttributeAccessor<boolean>;
            formtarget?: AttributeAccessor<string>;
            popovertarget?: AttributeAccessor<string>;
            popovertargetaction?: AttributeAccessor<"hide" | "show" | "toggle">;
            name?: AttributeAccessor<string>;
            type?: AttributeAccessor<"submit" | "reset" | "button">;
            value?: AttributeAccessor<string>;
            formAction?: AttributeAccessor<string | SerializableAttributeValue>;
            formEnctype?: AttributeAccessor<HTMLFormEncType>;
            formMethod?: AttributeAccessor<HTMLFormMethod>;
            formNoValidate?: AttributeAccessor<boolean>;
            formTarget?: AttributeAccessor<string>;
            popoverTarget?: AttributeAccessor<string>;
            popoverTargetAction?: AttributeAccessor<"hide" | "show" | "toggle">;
        }
        interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
        }
        interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
            span?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
        }
        interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
            span?: AttributeAccessor<number | string>;
        }
        interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
            value?: AttributeAccessor<string | string[] | number>;
        }
        interface DetailsHtmlAttributes<T> extends HTMLAttributes<T> {
            open?: AttributeAccessor<boolean>;
            onToggle?: EventHandlerUnion<T, Event>;
            ontoggle?: EventHandlerUnion<T, Event>;
        }
        interface DialogHtmlAttributes<T> extends HTMLAttributes<T> {
            open?: AttributeAccessor<boolean>;
            onClose?: EventHandlerUnion<T, Event>;
            onCancel?: EventHandlerUnion<T, Event>;
        }
        interface DirectoryHTMLAttributes<T> extends HTMLAttributes<T> {
            compact?: AttributeAccessor<boolean>;
        }
        interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
            height?: AttributeAccessor<number | string>;
            src?: AttributeAccessor<string>;
            type?: AttributeAccessor<string>;
            width?: AttributeAccessor<number | string>;
        }
        interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
            disabled?: AttributeAccessor<boolean>;
            form?: AttributeAccessor<string>;
            name?: AttributeAccessor<string>;
        }
        interface FontHTMLAttributes<T> extends HTMLAttributes<T> {
            color?: AttributeAccessor<string>;
            face?: AttributeAccessor<string>;
            size?: AttributeAccessor<string>;
        }
        interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
            "accept-charset"?: AttributeAccessor<string>;
            action?: AttributeAccessor<string | SerializableAttributeValue>;
            autocomplete?: AttributeAccessor<string>;
            encoding?: AttributeAccessor<HTMLFormEncType>;
            enctype?: AttributeAccessor<HTMLFormEncType>;
            method?: AttributeAccessor<HTMLFormMethod>;
            name?: AttributeAccessor<string>;
            novalidate?: AttributeAccessor<boolean>;
            target?: AttributeAccessor<string>;
            noValidate?: AttributeAccessor<boolean>;
        }
        interface FrameHTMLAttributes<T> extends HTMLAttributes<T> {
            frameBorder?: AttributeAccessor<string>;
            longDesc?: AttributeAccessor<string>;
            marginHeight?: AttributeAccessor<string>;
            marginWidth?: AttributeAccessor<string>;
            name?: AttributeAccessor<string>;
            noResize?: AttributeAccessor<boolean>;
            scrolling?: AttributeAccessor<string>;
            src?: AttributeAccessor<string>;
        }
        interface FrameSetHTMLAttributes<T> extends HTMLAttributes<T> {
            cols?: AttributeAccessor<string>;
            rows?: AttributeAccessor<string>;
        }
        interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
            allow?: AttributeAccessor<string>;
            allowfullscreen?: AttributeAccessor<boolean>;
            height?: AttributeAccessor<number | string>;
            loading?: AttributeAccessor<"eager" | "lazy">;
            name?: AttributeAccessor<string>;
            referrerpolicy?: AttributeAccessor<HTMLReferrerPolicy>;
            sandbox?: HTMLIframeSandbox | string;
            src?: AttributeAccessor<string>;
            srcdoc?: AttributeAccessor<string>;
            width?: AttributeAccessor<number | string>;
            referrerPolicy?: AttributeAccessor<HTMLReferrerPolicy>;
        }
        interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
            alt?: AttributeAccessor<string>;
            crossorigin?: AttributeAccessor<HTMLCrossorigin>;
            decoding?: AttributeAccessor<"sync" | "async" | "auto">;
            height?: AttributeAccessor<number | string>;
            ismap?: AttributeAccessor<boolean>;
            isMap?: AttributeAccessor<boolean>;
            loading?: AttributeAccessor<"eager" | "lazy">;
            referrerpolicy?: AttributeAccessor<HTMLReferrerPolicy>;
            referrerPolicy?: AttributeAccessor<HTMLReferrerPolicy>;
            sizes?: AttributeAccessor<string>;
            src?: AttributeAccessor<string>;
            srcset?: AttributeAccessor<string>;
            srcSet?: AttributeAccessor<string>;
            usemap?: AttributeAccessor<string>;
            useMap?: AttributeAccessor<string>;
            width?: AttributeAccessor<number | string>;
            crossOrigin?: AttributeAccessor<HTMLCrossorigin>;
            elementtiming?: AttributeAccessor<string>;
            fetchpriority?: AttributeAccessor<"high" | "low" | "auto">;
        }
        interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
            accept?: AttributeAccessor<string>;
            alt?: AttributeAccessor<string>;
            autocomplete?: AttributeAccessor<string>;
            autocorrect?: AttributeAccessor<"on" | "off">;
            autofocus?: AttributeAccessor<boolean>;
            capture?: AttributeAccessor<boolean | string>;
            checked?: AttributeAccessor<boolean>;
            crossorigin?: AttributeAccessor<HTMLCrossorigin>;
            disabled?: AttributeAccessor<boolean>;
            enterkeyhint?: AttributeAccessor<
                "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
            >;
            form?: AttributeAccessor<string>;
            formaction?: AttributeAccessor<string | SerializableAttributeValue>;
            formenctype?: AttributeAccessor<HTMLFormEncType>;
            formmethod?: AttributeAccessor<HTMLFormMethod>;
            formnovalidate?: AttributeAccessor<boolean>;
            formtarget?: AttributeAccessor<string>;
            height?: AttributeAccessor<number | string>;
            incremental?: AttributeAccessor<boolean>;
            list?: AttributeAccessor<string>;
            max?: AttributeAccessor<number | string>;
            maxlength?: AttributeAccessor<number | string>;
            min?: AttributeAccessor<number | string>;
            minlength?: AttributeAccessor<number | string>;
            multiple?: AttributeAccessor<boolean>;
            name?: AttributeAccessor<string>;
            pattern?: AttributeAccessor<string>;
            placeholder?: AttributeAccessor<string>;
            readonly?: AttributeAccessor<boolean>;
            results?: AttributeAccessor<number>;
            required?: AttributeAccessor<boolean>;
            size?: AttributeAccessor<number | string>;
            src?: AttributeAccessor<string>;
            step?: AttributeAccessor<number | string>;
            type?: AttributeAccessor<string>;
            value?: AttributeAccessor<string | string[] | number>;
            width?: AttributeAccessor<number | string>;
            crossOrigin?: AttributeAccessor<HTMLCrossorigin>;
            formAction?: AttributeAccessor<string | SerializableAttributeValue>;
            formEnctype?: AttributeAccessor<HTMLFormEncType>;
            formMethod?: AttributeAccessor<HTMLFormMethod>;
            formNoValidate?: AttributeAccessor<boolean>;
            formTarget?: AttributeAccessor<string>;
            maxLength?: AttributeAccessor<number | string>;
            minLength?: AttributeAccessor<number | string>;
            readOnly?: AttributeAccessor<boolean>;
        }
        interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
            cite?: AttributeAccessor<string>;
            dateTime?: AttributeAccessor<string>;
        }
        interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
            autofocus?: AttributeAccessor<boolean>;
            challenge?: AttributeAccessor<string>;
            disabled?: AttributeAccessor<boolean>;
            form?: AttributeAccessor<string>;
            keytype?: AttributeAccessor<string>;
            keyparams?: AttributeAccessor<string>;
            name?: AttributeAccessor<string>;
        }
        interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
            for?: AttributeAccessor<string>;
            form?: AttributeAccessor<string>;
        }
        interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
            value?: AttributeAccessor<number | string>;
        }
        interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
            as?: AttributeAccessor<HTMLLinkAs>;
            crossorigin?: AttributeAccessor<HTMLCrossorigin>;
            disabled?: AttributeAccessor<boolean>;
            fetchpriority?: AttributeAccessor<"high" | "low" | "auto">;
            href?: AttributeAccessor<string>;
            hreflang?: AttributeAccessor<string>;
            imagesizes?: AttributeAccessor<string>;
            imagesrcset?: AttributeAccessor<string>;
            integrity?: AttributeAccessor<string>;
            media?: AttributeAccessor<string>;
            referrerpolicy?: AttributeAccessor<HTMLReferrerPolicy>;
            rel?: AttributeAccessor<string>;
            sizes?: AttributeAccessor<string>;
            type?: AttributeAccessor<string>;
            crossOrigin?: AttributeAccessor<HTMLCrossorigin>;
            referrerPolicy?: AttributeAccessor<HTMLReferrerPolicy>;
        }
        interface MarqueeHTMLAttributes<T> extends HTMLAttributes<T> {
            behavior?: AttributeAccessor<string>;
            bgColor?: AttributeAccessor<string>;
            direction?: AttributeAccessor<string>;
            height?: AttributeAccessor<string>;
            hspace?: AttributeAccessor<number>;
            loop?: AttributeAccessor<number>;
            scrollAmount?: AttributeAccessor<number>;
            scrollDelay?: AttributeAccessor<number>;
            trueSpeed?: AttributeAccessor<boolean>;
            vspace?: AttributeAccessor<number>;
            width?: AttributeAccessor<string>;
        }
        interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
            name?: AttributeAccessor<string>;
        }
        interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
            autoplay?: AttributeAccessor<boolean>;
            controls?: AttributeAccessor<boolean>;
            crossorigin?: AttributeAccessor<HTMLCrossorigin>;
            loop?: AttributeAccessor<boolean>;
            mediagroup?: AttributeAccessor<string>;
            muted?: AttributeAccessor<boolean>;
            preload?: AttributeAccessor<"none" | "metadata" | "auto" | "">;
            src?: AttributeAccessor<string>;
            crossOrigin?: AttributeAccessor<HTMLCrossorigin>;
            mediaGroup?: AttributeAccessor<string>;
        }
        interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
            label?: AttributeAccessor<string>;
            type?: AttributeAccessor<"context" | "toolbar">;
        }
        interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
            charset?: AttributeAccessor<string>;
            content?: AttributeAccessor<string>;
            "http-equiv"?: AttributeAccessor<string>;
            name?: AttributeAccessor<string>;
            media?: AttributeAccessor<string>;
        }
        interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
            form?: AttributeAccessor<string>;
            high?: AttributeAccessor<number | string>;
            low?: AttributeAccessor<number | string>;
            max?: AttributeAccessor<number | string>;
            min?: AttributeAccessor<number | string>;
            optimum?: AttributeAccessor<number | string>;
            value?: AttributeAccessor<string | string[] | number>;
        }
        interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
            cite?: AttributeAccessor<string>;
        }
        interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
            data?: AttributeAccessor<string>;
            form?: AttributeAccessor<string>;
            height?: AttributeAccessor<number | string>;
            name?: AttributeAccessor<string>;
            type?: AttributeAccessor<string>;
            usemap?: AttributeAccessor<string>;
            width?: AttributeAccessor<number | string>;
            useMap?: AttributeAccessor<string>;
        }
        interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
            reversed?: AttributeAccessor<boolean>;
            start?: AttributeAccessor<number | string>;
            type?: AttributeAccessor<"1" | "a" | "A" | "i" | "I">;
        }
        interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
            disabled?: AttributeAccessor<boolean>;
            label?: AttributeAccessor<string>;
        }
        interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
            disabled?: AttributeAccessor<boolean>;
            label?: AttributeAccessor<string>;
            selected?: AttributeAccessor<boolean>;
            value?: AttributeAccessor<string | string[] | number>;
        }
        interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
            form?: AttributeAccessor<string>;
            for?: AttributeAccessor<string>;
            name?: AttributeAccessor<string>;
        }
        interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
            name?: AttributeAccessor<string>;
            value?: AttributeAccessor<string | string[] | number>;
        }
        interface PreHTMLAttributes<T> extends HTMLAttributes<T> {
            width?: AttributeAccessor<number>;
        }
        interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
            max?: AttributeAccessor<number | string>;
            value?: AttributeAccessor<string | string[] | number>;
        }
        interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
            async?: AttributeAccessor<boolean>;
            charset?: AttributeAccessor<string>;
            crossorigin?: AttributeAccessor<HTMLCrossorigin>;
            defer?: AttributeAccessor<boolean>;
            integrity?: AttributeAccessor<string>;
            nomodule?: AttributeAccessor<boolean>;
            nonce?: AttributeAccessor<string>;
            referrerpolicy?: AttributeAccessor<HTMLReferrerPolicy>;
            src?: AttributeAccessor<string>;
            type?: AttributeAccessor<string>;
            crossOrigin?: AttributeAccessor<HTMLCrossorigin>;
            noModule?: AttributeAccessor<boolean>;
            referrerPolicy?: AttributeAccessor<HTMLReferrerPolicy>;
        }
        interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
            autocomplete?: AttributeAccessor<string>;
            autofocus?: AttributeAccessor<boolean>;
            disabled?: AttributeAccessor<boolean>;
            form?: AttributeAccessor<string>;
            multiple?: AttributeAccessor<boolean>;
            name?: AttributeAccessor<string>;
            required?: AttributeAccessor<boolean>;
            size?: AttributeAccessor<number | string>;
            value?: AttributeAccessor<string | string[] | number>;
        }
        interface HTMLSlotElementAttributes<T = HTMLSlotElement> extends HTMLAttributes<T> {
            name?: AttributeAccessor<string>;
        }
        interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
            media?: AttributeAccessor<string>;
            sizes?: AttributeAccessor<string>;
            src?: AttributeAccessor<string>;
            srcset?: AttributeAccessor<string>;
            type?: AttributeAccessor<string>;
        }
        interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
            media?: AttributeAccessor<string>;
            nonce?: AttributeAccessor<string>;
            scoped?: AttributeAccessor<boolean>;
            type?: AttributeAccessor<string>;
        }
        interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
            colspan?: AttributeAccessor<number | string>;
            headers?: AttributeAccessor<string>;
            rowspan?: AttributeAccessor<number | string>;
            colSpan?: AttributeAccessor<number | string>;
            rowSpan?: AttributeAccessor<number | string>;
        }
        interface TemplateHTMLAttributes<T extends HTMLTemplateElement> extends HTMLAttributes<T> {
            content?: AttributeAccessor<DocumentFragment>;
        }
        interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
            autocomplete?: AttributeAccessor<string>;
            autofocus?: AttributeAccessor<boolean>;
            cols?: AttributeAccessor<number | string>;
            dirname?: AttributeAccessor<string>;
            disabled?: AttributeAccessor<boolean>;
            enterkeyhint?: AttributeAccessor<
                "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
            >;
            form?: AttributeAccessor<string>;
            maxlength?: AttributeAccessor<number | string>;
            minlength?: AttributeAccessor<number | string>;
            name?: AttributeAccessor<string>;
            placeholder?: AttributeAccessor<string>;
            readonly?: AttributeAccessor<boolean>;
            required?: AttributeAccessor<boolean>;
            rows?: AttributeAccessor<number | string>;
            value?: AttributeAccessor<string | string[] | number>;
            wrap?: AttributeAccessor<"hard" | "soft" | "off">;
            maxLength?: AttributeAccessor<number | string>;
            minLength?: AttributeAccessor<number | string>;
            readOnly?: AttributeAccessor<boolean>;
        }
        interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
            colspan?: AttributeAccessor<number | string>;
            headers?: AttributeAccessor<string>;
            rowspan?: AttributeAccessor<number | string>;
            colSpan?: AttributeAccessor<number | string>;
            rowSpan?: AttributeAccessor<number | string>;
            scope?: AttributeAccessor<"col" | "row" | "rowgroup" | "colgroup">;
        }
        interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
            datetime?: AttributeAccessor<string>;
            dateTime?: AttributeAccessor<string>;
        }
        interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
            default?: AttributeAccessor<boolean>;
            kind?: AttributeAccessor<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata">;
            label?: AttributeAccessor<string>;
            src?: AttributeAccessor<string>;
            srclang?: AttributeAccessor<string>;
        }
        interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
            height?: AttributeAccessor<number | string>;
            playsinline?: AttributeAccessor<boolean>;
            poster?: AttributeAccessor<string>;
            width?: AttributeAccessor<number | string>;
        }
        type SVGPreserveAspectRatio =
            | "none"
            | "xMinYMin"
            | "xMidYMin"
            | "xMaxYMin"
            | "xMinYMid"
            | "xMidYMid"
            | "xMaxYMid"
            | "xMinYMax"
            | "xMidYMax"
            | "xMaxYMax"
            | "xMinYMin meet"
            | "xMidYMin meet"
            | "xMaxYMin meet"
            | "xMinYMid meet"
            | "xMidYMid meet"
            | "xMaxYMid meet"
            | "xMinYMax meet"
            | "xMidYMax meet"
            | "xMaxYMax meet"
            | "xMinYMin slice"
            | "xMidYMin slice"
            | "xMaxYMin slice"
            | "xMinYMid slice"
            | "xMidYMid slice"
            | "xMaxYMid slice"
            | "xMinYMax slice"
            | "xMidYMax slice"
            | "xMaxYMax slice";
        type ImagePreserveAspectRatio =
            | SVGPreserveAspectRatio
            | "defer none"
            | "defer xMinYMin"
            | "defer xMidYMin"
            | "defer xMaxYMin"
            | "defer xMinYMid"
            | "defer xMidYMid"
            | "defer xMaxYMid"
            | "defer xMinYMax"
            | "defer xMidYMax"
            | "defer xMaxYMax"
            | "defer xMinYMin meet"
            | "defer xMidYMin meet"
            | "defer xMaxYMin meet"
            | "defer xMinYMid meet"
            | "defer xMidYMid meet"
            | "defer xMaxYMid meet"
            | "defer xMinYMax meet"
            | "defer xMidYMax meet"
            | "defer xMaxYMax meet"
            | "defer xMinYMin slice"
            | "defer xMidYMin slice"
            | "defer xMaxYMin slice"
            | "defer xMinYMid slice"
            | "defer xMidYMid slice"
            | "defer xMaxYMid slice"
            | "defer xMinYMax slice"
            | "defer xMidYMax slice"
            | "defer xMaxYMax slice";
        type SVGUnits = "userSpaceOnUse" | "objectBoundingBox";
        interface CoreSVGAttributes<T> extends AriaAttributes, DOMAttributes<T> {
            id?: AttributeAccessor<string>;
            lang?: AttributeAccessor<string>;
            tabIndex?: AttributeAccessor<number | string>;
            tabindex?: AttributeAccessor<number | string>;
        }
        interface StylableSVGAttributes {
            class?: AttributeAccessor<string> | undefined;
            style?: AttributeAccessor<CSSProperties | string>;
        }
        interface TransformableSVGAttributes {
            transform?: AttributeAccessor<string>;
        }
        interface ConditionalProcessingSVGAttributes {
            requiredExtensions?: AttributeAccessor<string>;
            requiredFeatures?: AttributeAccessor<string>;
            systemLanguage?: AttributeAccessor<string>;
        }
        interface ExternalResourceSVGAttributes {
            externalResourcesRequired?: AttributeAccessor<"true" | "false">;
        }
        interface AnimationTimingSVGAttributes {
            begin?: AttributeAccessor<string>;
            dur?: AttributeAccessor<string>;
            end?: AttributeAccessor<string>;
            min?: AttributeAccessor<string>;
            max?: AttributeAccessor<string>;
            restart?: AttributeAccessor<"always" | "whenNotActive" | "never">;
            repeatCount?: AttributeAccessor<number | "indefinite">;
            repeatDur?: AttributeAccessor<string>;
            fill?: AttributeAccessor<"freeze" | "remove">;
        }
        interface AnimationValueSVGAttributes {
            calcMode?: AttributeAccessor<"discrete" | "linear" | "paced" | "spline">;
            values?: AttributeAccessor<string>;
            keyTimes?: AttributeAccessor<string>;
            keySplines?: AttributeAccessor<string>;
            from?: AttributeAccessor<number | string>;
            to?: AttributeAccessor<number | string>;
            by?: AttributeAccessor<number | string>;
        }
        interface AnimationAdditionSVGAttributes {
            attributeName?: AttributeAccessor<string>;
            additive?: AttributeAccessor<"replace" | "sum">;
            accumulate?: AttributeAccessor<"none" | "sum">;
        }
        interface AnimationAttributeTargetSVGAttributes {
            attributeName?: AttributeAccessor<string>;
            attributeType?: AttributeAccessor<"CSS" | "XML" | "auto">;
        }
        interface PresentationSVGAttributes {
            "alignment-baseline"?:
                | "auto"
                | "baseline"
                | "before-edge"
                | "text-before-edge"
                | "middle"
                | "central"
                | "after-edge"
                | "text-after-edge"
                | "ideographic"
                | "alphabetic"
                | "hanging"
                | "mathematical"
                | "inherit";
            "baseline-shift"?: AttributeAccessor<number | string>;
            clip?: AttributeAccessor<string>;
            "clip-path"?: AttributeAccessor<string>;
            "clip-rule"?: "nonzero" | "evenodd" | "inherit";
            color?: AttributeAccessor<string>;
            "color-interpolation"?: "auto" | "sRGB" | "linearRGB" | "inherit";
            "color-interpolation-filters"?: "auto" | "sRGB" | "linearRGB" | "inherit";
            "color-profile"?: AttributeAccessor<string>;
            "color-rendering"?: "auto" | "optimizeSpeed" | "optimizeQuality" | "inherit";
            cursor?: AttributeAccessor<string>;
            direction?: "ltr" | "rtl" | "inherit";
            display?: AttributeAccessor<string>;
            "dominant-baseline"?:
                | "auto"
                | "text-bottom"
                | "alphabetic"
                | "ideographic"
                | "middle"
                | "central"
                | "mathematical"
                | "hanging"
                | "text-top"
                | "inherit";
            "enable-background"?: AttributeAccessor<string>;
            fill?: AttributeAccessor<string>;
            "fill-opacity"?: AttributeAccessor<number | string | "inherit">;
            "fill-rule"?: AttributeAccessor<"nonzero" | "evenodd" | "inherit">;
            filter?: AttributeAccessor<string>;
            "flood-color"?: AttributeAccessor<string>;
            "flood-opacity"?: AttributeAccessor<number | string | "inherit">;
            "font-family"?: AttributeAccessor<string>;
            "font-size"?: AttributeAccessor<string>;
            "font-size-adjust"?: AttributeAccessor<number | string>;
            "font-stretch"?: AttributeAccessor<string>;
            "font-style"?: AttributeAccessor<"normal" | "italic" | "oblique" | "inherit">;
            "font-variant"?: AttributeAccessor<string>;
            "font-weight"?: AttributeAccessor<number | string>;
            "glyph-orientation-horizontal"?: AttributeAccessor<string>;
            "glyph-orientation-vertical"?: AttributeAccessor<string>;
            "image-rendering"?: AttributeAccessor<"auto" | "optimizeQuality" | "optimizeSpeed" | "inherit">;
            kerning?: AttributeAccessor<string>;
            "letter-spacing"?: AttributeAccessor<number | string>;
            "lighting-color"?: AttributeAccessor<string>;
            "marker-end"?: AttributeAccessor<string>;
            "marker-mid"?: AttributeAccessor<string>;
            "marker-start"?: AttributeAccessor<string>;
            mask?: AttributeAccessor<string>;
            opacity?: AttributeAccessor<number | string | "inherit">;
            overflow?: AttributeAccessor<"visible" | "hidden" | "scroll" | "auto" | "inherit">;
            pathLength?: AttributeAccessor<string | number>;
            "pointer-events"?: AttributeAccessor<
                | "bounding-box"
                | "visiblePainted"
                | "visibleFill"
                | "visibleStroke"
                | "visible"
                | "painted"
                | "color"
                | "fill"
                | "stroke"
                | "all"
                | "none"
                | "inherit"
            >;
            "shape-rendering"?: AttributeAccessor<
                "auto" | "optimizeSpeed" | "crispEdges" | "geometricPrecision" | "inherit"
            >;
            "stop-color"?: AttributeAccessor<string>;
            "stop-opacity"?: AttributeAccessor<number | string | "inherit">;
            stroke?: AttributeAccessor<string>;
            "stroke-dasharray"?: AttributeAccessor<string>;
            "stroke-dashoffset"?: AttributeAccessor<number | string>;
            "stroke-linecap"?: AttributeAccessor<"butt" | "round" | "square" | "inherit">;
            "stroke-linejoin"?: AttributeAccessor<
                "arcs" | "bevel" | "miter" | "miter-clip" | "round" | "inherit"
            >;
            "stroke-miterlimit"?: AttributeAccessor<number | string | "inherit">;
            "stroke-opacity"?: AttributeAccessor<number | string | "inherit">;
            "stroke-width"?: AttributeAccessor<number | string>;
            "text-anchor"?: AttributeAccessor<"start" | "middle" | "end" | "inherit">;
            "text-decoration"?: AttributeAccessor<
                "none" | "underline" | "overline" | "line-through" | "blink" | "inherit"
            >;
            "text-rendering"?: AttributeAccessor<
                "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision" | "inherit"
            >;
            "unicode-bidi"?: AttributeAccessor<string>;
            visibility?: AttributeAccessor<"visible" | "hidden" | "collapse" | "inherit">;
            "word-spacing"?: AttributeAccessor<number | string>;
            "writing-mode"?: AttributeAccessor<"lr-tb" | "rl-tb" | "tb-rl" | "lr" | "rl" | "tb" | "inherit">;
        }
        interface AnimationElementSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                ExternalResourceSVGAttributes,
                ConditionalProcessingSVGAttributes {}
        interface ContainerElementSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                Pick<
                    PresentationSVGAttributes,
                    | "clip-path"
                    | "mask"
                    | "cursor"
                    | "opacity"
                    | "filter"
                    | "enable-background"
                    | "color-interpolation"
                    | "color-rendering"
                > {}
        interface FilterPrimitiveElementSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                Pick<PresentationSVGAttributes, "color-interpolation-filters"> {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            result?: AttributeAccessor<string>;
        }
        interface SingleInputFilterSVGAttributes {
            in?: AttributeAccessor<string>;
        }
        interface DoubleInputFilterSVGAttributes {
            in?: AttributeAccessor<string>;
            in2?: AttributeAccessor<string>;
        }
        interface FitToViewBoxSVGAttributes {
            viewBox?: AttributeAccessor<string>;
            preserveAspectRatio?: AttributeAccessor<SVGPreserveAspectRatio>;
        }
        interface GradientElementSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes {
            gradientUnits?: AttributeAccessor<SVGUnits>;
            gradientTransform?: AttributeAccessor<string>;
            spreadMethod?: AttributeAccessor<"pad" | "reflect" | "repeat">;
            href?: AttributeAccessor<string>;
        }
        interface GraphicsElementSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                Pick<
                    PresentationSVGAttributes,
                    | "clip-rule"
                    | "mask"
                    | "pointer-events"
                    | "cursor"
                    | "opacity"
                    | "filter"
                    | "display"
                    | "visibility"
                    | "color-interpolation"
                    | "color-rendering"
                > {}
        interface LightSourceElementSVGAttributes<T> extends CoreSVGAttributes<T> {}
        interface NewViewportSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                Pick<PresentationSVGAttributes, "overflow" | "clip"> {
            viewBox?: AttributeAccessor<string>;
        }
        interface ShapeElementSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                Pick<
                    PresentationSVGAttributes,
                    | "color"
                    | "fill"
                    | "fill-rule"
                    | "fill-opacity"
                    | "stroke"
                    | "stroke-width"
                    | "stroke-linecap"
                    | "stroke-linejoin"
                    | "stroke-miterlimit"
                    | "stroke-dasharray"
                    | "stroke-dashoffset"
                    | "stroke-opacity"
                    | "shape-rendering"
                    | "pathLength"
                > {}
        interface TextContentElementSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                Pick<
                    PresentationSVGAttributes,
                    | "font-family"
                    | "font-style"
                    | "font-variant"
                    | "font-weight"
                    | "font-stretch"
                    | "font-size"
                    | "font-size-adjust"
                    | "kerning"
                    | "letter-spacing"
                    | "word-spacing"
                    | "text-decoration"
                    | "glyph-orientation-horizontal"
                    | "glyph-orientation-vertical"
                    | "direction"
                    | "unicode-bidi"
                    | "text-anchor"
                    | "dominant-baseline"
                    | "color"
                    | "fill"
                    | "fill-rule"
                    | "fill-opacity"
                    | "stroke"
                    | "stroke-width"
                    | "stroke-linecap"
                    | "stroke-linejoin"
                    | "stroke-miterlimit"
                    | "stroke-dasharray"
                    | "stroke-dashoffset"
                    | "stroke-opacity"
                > {}
        interface ZoomAndPanSVGAttributes {
            zoomAndPan?: AttributeAccessor<"disable" | "magnify">;
        }
        interface AnimateSVGAttributes<T>
            extends AnimationElementSVGAttributes<T>,
                AnimationAttributeTargetSVGAttributes,
                AnimationTimingSVGAttributes,
                AnimationValueSVGAttributes,
                AnimationAdditionSVGAttributes,
                Pick<PresentationSVGAttributes, "color-interpolation" | "color-rendering"> {}
        interface AnimateMotionSVGAttributes<T>
            extends AnimationElementSVGAttributes<T>,
                AnimationTimingSVGAttributes,
                AnimationValueSVGAttributes,
                AnimationAdditionSVGAttributes {
            path?: AttributeAccessor<string>;
            keyPoints?: AttributeAccessor<string>;
            rotate?: AttributeAccessor<number | string | "auto" | "auto-reverse">;
            origin?: AttributeAccessor<"default">;
        }
        interface AnimateTransformSVGAttributes<T>
            extends AnimationElementSVGAttributes<T>,
                AnimationAttributeTargetSVGAttributes,
                AnimationTimingSVGAttributes,
                AnimationValueSVGAttributes,
                AnimationAdditionSVGAttributes {
            type?: AttributeAccessor<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
        }
        interface CircleSVGAttributes<T>
            extends GraphicsElementSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes {
            cx?: AttributeAccessor<number | string>;
            cy?: AttributeAccessor<number | string>;
            r?: AttributeAccessor<number | string>;
        }
        interface ClipPathSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "clip-path"> {
            clipPathUnits?: AttributeAccessor<SVGUnits>;
        }
        interface DefsSVGAttributes<T>
            extends ContainerElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes {}
        interface DescSVGAttributes<T> extends CoreSVGAttributes<T>, StylableSVGAttributes {}
        interface EllipseSVGAttributes<T>
            extends GraphicsElementSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes {
            cx?: AttributeAccessor<number | string>;
            cy?: AttributeAccessor<number | string>;
            rx?: AttributeAccessor<number | string>;
            ry?: AttributeAccessor<number | string>;
        }
        interface FeBlendSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                DoubleInputFilterSVGAttributes,
                StylableSVGAttributes {
            mode?: AttributeAccessor<"normal" | "multiply" | "screen" | "darken" | "lighten">;
        }
        interface FeColorMatrixSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes {
            type?: AttributeAccessor<"matrix" | "saturate" | "hueRotate" | "luminanceToAlpha">;
            values?: AttributeAccessor<string>;
        }
        interface FeComponentTransferSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes {}
        interface FeCompositeSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                DoubleInputFilterSVGAttributes,
                StylableSVGAttributes {
            operator?: AttributeAccessor<"over" | "in" | "out" | "atop" | "xor" | "arithmetic">;
            k1?: AttributeAccessor<number | string>;
            k2?: AttributeAccessor<number | string>;
            k3?: AttributeAccessor<number | string>;
            k4?: AttributeAccessor<number | string>;
        }
        interface FeConvolveMatrixSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes {
            order?: AttributeAccessor<number | string>;
            kernelMatrix?: AttributeAccessor<string>;
            divisor?: AttributeAccessor<number | string>;
            bias?: AttributeAccessor<number | string>;
            targetX?: AttributeAccessor<number | string>;
            targetY?: AttributeAccessor<number | string>;
            edgeMode?: AttributeAccessor<"duplicate" | "wrap" | "none">;
            kernelUnitLength?: AttributeAccessor<number | string>;
            preserveAlpha?: AttributeAccessor<"true" | "false">;
        }
        interface FeDiffuseLightingSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes,
                Pick<PresentationSVGAttributes, "color" | "lighting-color"> {
            surfaceScale?: AttributeAccessor<number | string>;
            diffuseConstant?: AttributeAccessor<number | string>;
            kernelUnitLength?: AttributeAccessor<number | string>;
        }
        interface FeDisplacementMapSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                DoubleInputFilterSVGAttributes,
                StylableSVGAttributes {
            scale?: AttributeAccessor<number | string>;
            xChannelSelector?: AttributeAccessor<"R" | "G" | "B" | "A">;
            yChannelSelector?: AttributeAccessor<"R" | "G" | "B" | "A">;
        }
        interface FeDistantLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
            azimuth?: AttributeAccessor<number | string>;
            elevation?: AttributeAccessor<number | string>;
        }
        interface FeDropShadowSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                FilterPrimitiveElementSVGAttributes<T>,
                StylableSVGAttributes,
                Pick<PresentationSVGAttributes, "color" | "flood-color" | "flood-opacity"> {
            dx?: AttributeAccessor<number | string>;
            dy?: AttributeAccessor<number | string>;
            stdDeviation?: AttributeAccessor<number | string>;
        }
        interface FeFloodSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                StylableSVGAttributes,
                Pick<PresentationSVGAttributes, "color" | "flood-color" | "flood-opacity"> {}
        interface FeFuncSVGAttributes<T> extends CoreSVGAttributes<T> {
            type?: "identity" | "table" | "discrete" | "linear" | "gamma";
            tableValues?: AttributeAccessor<string>;
            slope?: AttributeAccessor<number | string>;
            intercept?: AttributeAccessor<number | string>;
            amplitude?: AttributeAccessor<number | string>;
            exponent?: AttributeAccessor<number | string>;
            offset?: AttributeAccessor<number | string>;
        }
        interface FeGaussianBlurSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes {
            stdDeviation?: AttributeAccessor<number | string>;
        }
        interface FeImageSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes {
            preserveAspectRatio?: AttributeAccessor<SVGPreserveAspectRatio>;
            href?: AttributeAccessor<string>;
        }
        interface FeMergeSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                StylableSVGAttributes {}
        interface FeMergeNodeSVGAttributes<T> extends CoreSVGAttributes<T>, SingleInputFilterSVGAttributes {}
        interface FeMorphologySVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes {
            operator?: AttributeAccessor<"erode" | "dilate">;
            radius?: AttributeAccessor<number | string>;
        }
        interface FeOffsetSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes {
            dx?: AttributeAccessor<number | string>;
            dy?: AttributeAccessor<number | string>;
        }
        interface FePointLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            z?: AttributeAccessor<number | string>;
        }
        interface FeSpecularLightingSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes,
                Pick<PresentationSVGAttributes, "color" | "lighting-color"> {
            surfaceScale?: AttributeAccessor<string>;
            specularConstant?: AttributeAccessor<string>;
            specularExponent?: AttributeAccessor<string>;
            kernelUnitLength?: AttributeAccessor<number | string>;
        }
        interface FeSpotLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            z?: AttributeAccessor<number | string>;
            pointsAtX?: AttributeAccessor<number | string>;
            pointsAtY?: AttributeAccessor<number | string>;
            pointsAtZ?: AttributeAccessor<number | string>;
            specularExponent?: AttributeAccessor<number | string>;
            limitingConeAngle?: AttributeAccessor<number | string>;
        }
        interface FeTileSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                SingleInputFilterSVGAttributes,
                StylableSVGAttributes {}
        interface FeTurbulanceSVGAttributes<T>
            extends FilterPrimitiveElementSVGAttributes<T>,
                StylableSVGAttributes {
            baseFrequency?: AttributeAccessor<number | string>;
            numOctaves?: AttributeAccessor<number | string>;
            seed?: AttributeAccessor<number | string>;
            stitchTiles?: AttributeAccessor<"stitch" | "noStitch">;
            type?: AttributeAccessor<"fractalNoise" | "turbulence">;
        }
        interface FilterSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes {
            filterUnits?: AttributeAccessor<SVGUnits>;
            primitiveUnits?: AttributeAccessor<SVGUnits>;
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            filterRes?: AttributeAccessor<number | string>;
        }
        interface ForeignObjectSVGAttributes<T>
            extends NewViewportSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "display" | "visibility"> {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
        }
        interface GSVGAttributes<T>
            extends ContainerElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "display" | "visibility"> {}
        interface ImageSVGAttributes<T>
            extends NewViewportSVGAttributes<T>,
                GraphicsElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "color-profile" | "image-rendering"> {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            preserveAspectRatio?: AttributeAccessor<ImagePreserveAspectRatio>;
            href?: AttributeAccessor<string>;
        }
        interface LineSVGAttributes<T>
            extends GraphicsElementSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "marker-start" | "marker-mid" | "marker-end"> {
            x1?: AttributeAccessor<number | string>;
            y1?: AttributeAccessor<number | string>;
            x2?: AttributeAccessor<number | string>;
            y2?: AttributeAccessor<number | string>;
        }
        interface LinearGradientSVGAttributes<T> extends GradientElementSVGAttributes<T> {
            x1?: AttributeAccessor<number | string>;
            x2?: AttributeAccessor<number | string>;
            y1?: AttributeAccessor<number | string>;
            y2?: AttributeAccessor<number | string>;
        }
        interface MarkerSVGAttributes<T>
            extends ContainerElementSVGAttributes<T>,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                FitToViewBoxSVGAttributes,
                Pick<PresentationSVGAttributes, "overflow" | "clip"> {
            markerUnits?: AttributeAccessor<"strokeWidth" | "userSpaceOnUse">;
            refX?: AttributeAccessor<number | string>;
            refY?: AttributeAccessor<number | string>;
            markerWidth?: AttributeAccessor<number | string>;
            markerHeight?: AttributeAccessor<number | string>;
            orient?: AttributeAccessor<string>;
        }
        interface MaskSVGAttributes<T>
            extends Omit<ContainerElementSVGAttributes<T>, "opacity" | "filter">,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes {
            maskUnits?: AttributeAccessor<SVGUnits>;
            maskContentUnits?: AttributeAccessor<SVGUnits>;
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
        }
        interface MetadataSVGAttributes<T> extends CoreSVGAttributes<T> {}
        interface MPathSVGAttributes<T> extends CoreSVGAttributes<T> {}
        interface PathSVGAttributes<T>
            extends GraphicsElementSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "marker-start" | "marker-mid" | "marker-end"> {
            d?: AttributeAccessor<string>;
            pathLength?: AttributeAccessor<number | string>;
        }
        interface PatternSVGAttributes<T>
            extends ContainerElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                FitToViewBoxSVGAttributes,
                Pick<PresentationSVGAttributes, "overflow" | "clip"> {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            patternUnits?: AttributeAccessor<SVGUnits>;
            patternContentUnits?: AttributeAccessor<SVGUnits>;
            patternTransform?: AttributeAccessor<string>;
            href?: string;
        }
        interface PolygonSVGAttributes<T>
            extends GraphicsElementSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "marker-start" | "marker-mid" | "marker-end"> {
            points?: AttributeAccessor<string>;
        }
        interface PolylineSVGAttributes<T>
            extends GraphicsElementSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "marker-start" | "marker-mid" | "marker-end"> {
            points?: AttributeAccessor<string>;
        }
        interface RadialGradientSVGAttributes<T> extends GradientElementSVGAttributes<T> {
            cx?: AttributeAccessor<number | string>;
            cy?: AttributeAccessor<number | string>;
            r?: AttributeAccessor<number | string>;
            fx?: AttributeAccessor<number | string>;
            fy?: AttributeAccessor<number | string>;
        }
        interface RectSVGAttributes<T>
            extends GraphicsElementSVGAttributes<T>,
                ShapeElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            rx?: AttributeAccessor<number | string>;
            ry?: AttributeAccessor<number | string>;
        }
        interface SetSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                StylableSVGAttributes,
                AnimationTimingSVGAttributes {}
        interface StopSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                StylableSVGAttributes,
                Pick<PresentationSVGAttributes, "color" | "stop-color" | "stop-opacity"> {
            offset?: AttributeAccessor<number | string>;
        }
        interface SvgSVGAttributes<T>
            extends ContainerElementSVGAttributes<T>,
                NewViewportSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                FitToViewBoxSVGAttributes,
                ZoomAndPanSVGAttributes,
                PresentationSVGAttributes {
            version?: AttributeAccessor<string>;
            baseProfile?: AttributeAccessor<string>;
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            contentScriptType?: AttributeAccessor<string>;
            contentStyleType?: AttributeAccessor<string>;
            xmlns?: AttributeAccessor<string>;
            "xmlns:xlink"?: AttributeAccessor<string>;
        }
        interface SwitchSVGAttributes<T>
            extends ContainerElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "display" | "visibility"> {}
        interface SymbolSVGAttributes<T>
            extends ContainerElementSVGAttributes<T>,
                NewViewportSVGAttributes<T>,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                FitToViewBoxSVGAttributes {
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            preserveAspectRatio?: AttributeAccessor<SVGPreserveAspectRatio>;
            refX?: AttributeAccessor<number | string>;
            refY?: AttributeAccessor<number | string>;
            viewBox?: AttributeAccessor<string>;
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
        }
        interface TextSVGAttributes<T>
            extends TextContentElementSVGAttributes<T>,
                GraphicsElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                TransformableSVGAttributes,
                Pick<PresentationSVGAttributes, "writing-mode" | "text-rendering"> {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            dx?: AttributeAccessor<number | string>;
            dy?: AttributeAccessor<number | string>;
            rotate?: AttributeAccessor<number | string>;
            textLength?: AttributeAccessor<number | string>;
            lengthAdjust?: AttributeAccessor<"spacing" | "spacingAndGlyphs">;
        }
        interface TextPathSVGAttributes<T>
            extends TextContentElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                Pick<
                    PresentationSVGAttributes,
                    "alignment-baseline" | "baseline-shift" | "display" | "visibility"
                > {
            startOffset?: AttributeAccessor<number | string>;
            method?: AttributeAccessor<"align" | "stretch">;
            spacing?: AttributeAccessor<"auto" | "exact">;
            href?: AttributeAccessor<string>;
        }
        interface TSpanSVGAttributes<T>
            extends TextContentElementSVGAttributes<T>,
                ConditionalProcessingSVGAttributes,
                ExternalResourceSVGAttributes,
                StylableSVGAttributes,
                Pick<
                    PresentationSVGAttributes,
                    "alignment-baseline" | "baseline-shift" | "display" | "visibility"
                > {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            dx?: AttributeAccessor<number | string>;
            dy?: AttributeAccessor<number | string>;
            rotate?: AttributeAccessor<number | string>;
            textLength?: AttributeAccessor<number | string>;
            lengthAdjust?: AttributeAccessor<"spacing" | "spacingAndGlyphs">;
        }
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
         */
        interface UseSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                StylableSVGAttributes,
                ConditionalProcessingSVGAttributes,
                GraphicsElementSVGAttributes<T>,
                PresentationSVGAttributes,
                ExternalResourceSVGAttributes,
                TransformableSVGAttributes {
            x?: AttributeAccessor<number | string>;
            y?: AttributeAccessor<number | string>;
            width?: AttributeAccessor<number | string>;
            height?: AttributeAccessor<number | string>;
            href?: AttributeAccessor<string>;
        }
        interface ViewSVGAttributes<T>
            extends CoreSVGAttributes<T>,
                ExternalResourceSVGAttributes,
                FitToViewBoxSVGAttributes,
                ZoomAndPanSVGAttributes {
            viewTarget?: AttributeAccessor<string>;
        }
        /**
         * @type {HTMLElementTagNameMap}
         */
        interface HTMLElementTags {
            a: AnchorHTMLAttributes<HTMLAnchorElement>;
            abbr: HTMLAttributes<HTMLElement>;
            address: HTMLAttributes<HTMLElement>;
            area: AreaHTMLAttributes<HTMLAreaElement>;
            article: HTMLAttributes<HTMLElement>;
            aside: HTMLAttributes<HTMLElement>;
            audio: AudioHTMLAttributes<HTMLAudioElement>;
            b: HTMLAttributes<HTMLElement>;
            base: BaseHTMLAttributes<HTMLBaseElement>;
            bdi: HTMLAttributes<HTMLElement>;
            bdo: HTMLAttributes<HTMLElement>;
            blockquote: BlockquoteHTMLAttributes<HTMLElement>;
            body: HTMLAttributes<HTMLBodyElement>;
            br: HTMLAttributes<HTMLBRElement>;
            button: ButtonHTMLAttributes<HTMLButtonElement>;
            canvas: CanvasHTMLAttributes<HTMLCanvasElement>;
            caption: HTMLAttributes<HTMLElement>;
            cite: HTMLAttributes<HTMLElement>;
            code: HTMLAttributes<HTMLElement>;
            col: ColHTMLAttributes<HTMLTableColElement>;
            colgroup: ColgroupHTMLAttributes<HTMLTableColElement>;
            data: DataHTMLAttributes<HTMLElement>;
            datalist: HTMLAttributes<HTMLDataListElement>;
            dd: HTMLAttributes<HTMLElement>;
            del: HTMLAttributes<HTMLElement>;
            details: DetailsHtmlAttributes<HTMLDetailsElement>;
            dfn: HTMLAttributes<HTMLElement>;
            dialog: DialogHtmlAttributes<HTMLDialogElement>;
            div: HTMLAttributes<HTMLDivElement>;
            dl: HTMLAttributes<HTMLDListElement>;
            dt: HTMLAttributes<HTMLElement>;
            em: HTMLAttributes<HTMLElement>;
            embed: EmbedHTMLAttributes<HTMLEmbedElement>;
            fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement>;
            figcaption: HTMLAttributes<HTMLElement>;
            figure: HTMLAttributes<HTMLElement>;
            footer: HTMLAttributes<HTMLElement>;
            form: FormHTMLAttributes<HTMLFormElement>;
            h1: HTMLAttributes<HTMLHeadingElement>;
            h2: HTMLAttributes<HTMLHeadingElement>;
            h3: HTMLAttributes<HTMLHeadingElement>;
            h4: HTMLAttributes<HTMLHeadingElement>;
            h5: HTMLAttributes<HTMLHeadingElement>;
            h6: HTMLAttributes<HTMLHeadingElement>;
            head: HTMLAttributes<HTMLHeadElement>;
            header: HTMLAttributes<HTMLElement>;
            hgroup: HTMLAttributes<HTMLElement>;
            hr: HTMLAttributes<HTMLHRElement>;
            html: HTMLAttributes<HTMLHtmlElement>;
            i: HTMLAttributes<HTMLElement>;
            iframe: IframeHTMLAttributes<HTMLIFrameElement>;
            img: ImgHTMLAttributes<HTMLImageElement>;
            input: InputHTMLAttributes<HTMLInputElement>;
            ins: InsHTMLAttributes<HTMLModElement>;
            kbd: HTMLAttributes<HTMLElement>;
            label: LabelHTMLAttributes<HTMLLabelElement>;
            legend: HTMLAttributes<HTMLLegendElement>;
            li: LiHTMLAttributes<HTMLLIElement>;
            link: LinkHTMLAttributes<HTMLLinkElement>;
            main: HTMLAttributes<HTMLElement>;
            map: MapHTMLAttributes<HTMLMapElement>;
            mark: HTMLAttributes<HTMLElement>;
            menu: MenuHTMLAttributes<HTMLElement>;
            meta: MetaHTMLAttributes<HTMLMetaElement>;
            meter: MeterHTMLAttributes<HTMLElement>;
            nav: HTMLAttributes<HTMLElement>;
            noscript: HTMLAttributes<HTMLElement>;
            object: ObjectHTMLAttributes<HTMLObjectElement>;
            ol: OlHTMLAttributes<HTMLOListElement>;
            optgroup: OptgroupHTMLAttributes<HTMLOptGroupElement>;
            option: OptionHTMLAttributes<HTMLOptionElement>;
            output: OutputHTMLAttributes<HTMLElement>;
            p: HTMLAttributes<HTMLParagraphElement>;
            picture: HTMLAttributes<HTMLElement>;
            pre: HTMLAttributes<HTMLPreElement>;
            progress: ProgressHTMLAttributes<HTMLProgressElement>;
            q: QuoteHTMLAttributes<HTMLQuoteElement>;
            rp: HTMLAttributes<HTMLElement>;
            rt: HTMLAttributes<HTMLElement>;
            ruby: HTMLAttributes<HTMLElement>;
            s: HTMLAttributes<HTMLElement>;
            samp: HTMLAttributes<HTMLElement>;
            script: ScriptHTMLAttributes<HTMLScriptElement>;
            search: HTMLAttributes<HTMLElement>;
            section: HTMLAttributes<HTMLElement>;
            select: SelectHTMLAttributes<HTMLSelectElement>;
            slot: HTMLSlotElementAttributes;
            small: HTMLAttributes<HTMLElement>;
            source: SourceHTMLAttributes<HTMLSourceElement>;
            span: HTMLAttributes<HTMLSpanElement>;
            strong: HTMLAttributes<HTMLElement>;
            style: StyleHTMLAttributes<HTMLStyleElement>;
            sub: HTMLAttributes<HTMLElement>;
            summary: HTMLAttributes<HTMLElement>;
            sup: HTMLAttributes<HTMLElement>;
            table: HTMLAttributes<HTMLTableElement>;
            tbody: HTMLAttributes<HTMLTableSectionElement>;
            td: TdHTMLAttributes<HTMLTableCellElement>;
            template: TemplateHTMLAttributes<HTMLTemplateElement>;
            textarea: TextareaHTMLAttributes<HTMLTextAreaElement>;
            tfoot: HTMLAttributes<HTMLTableSectionElement>;
            th: ThHTMLAttributes<HTMLTableCellElement>;
            thead: HTMLAttributes<HTMLTableSectionElement>;
            time: TimeHTMLAttributes<HTMLElement>;
            title: HTMLAttributes<HTMLTitleElement>;
            tr: HTMLAttributes<HTMLTableRowElement>;
            track: TrackHTMLAttributes<HTMLTrackElement>;
            u: HTMLAttributes<HTMLElement>;
            ul: HTMLAttributes<HTMLUListElement>;
            var: HTMLAttributes<HTMLElement>;
            video: VideoHTMLAttributes<HTMLVideoElement>;
            wbr: HTMLAttributes<HTMLElement>;
        }
        /**
         * @type {HTMLElementDeprecatedTagNameMap}
         */
        interface HTMLElementDeprecatedTags {
            acronym: HTMLAttributes<HTMLElement>;
            applet: HTMLAttributes<HTMLUnknownElement>;
            basefont: HTMLAttributes<HTMLElement>;
            bgsound: HTMLAttributes<HTMLUnknownElement>;
            big: HTMLAttributes<HTMLElement>;
            blink: HTMLAttributes<HTMLUnknownElement>;
            center: HTMLAttributes<HTMLElement>;
            dir: DirectoryHTMLAttributes<HTMLDirectoryElement>;
            font: FontHTMLAttributes<HTMLFontElement>;
            frame: FrameHTMLAttributes<HTMLFrameElement>;
            frameset: FrameSetHTMLAttributes<HTMLFrameSetElement>;
            isindex: HTMLAttributes<HTMLUnknownElement>;
            keygen: KeygenHTMLAttributes<HTMLElement>;
            listing: PreHTMLAttributes<HTMLPreElement>;
            marquee: MarqueeHTMLAttributes<HTMLMarqueeElement>;
            menuitem: HTMLAttributes<HTMLElement>;
            multicol: HTMLAttributes<HTMLUnknownElement>;
            nextid: HTMLAttributes<HTMLUnknownElement>;
            nobr: HTMLAttributes<HTMLElement>;
            noembed: HTMLAttributes<HTMLElement>;
            noindex: HTMLAttributes<HTMLElement>;
            noframes: HTMLAttributes<HTMLElement>;
            param: ParamHTMLAttributes<HTMLParamElement>;
            plaintext: HTMLAttributes<HTMLElement>;
            rb: HTMLAttributes<HTMLElement>;
            rtc: HTMLAttributes<HTMLElement>;
            spacer: HTMLAttributes<HTMLUnknownElement>;
            strike: HTMLAttributes<HTMLElement>;
            tt: HTMLAttributes<HTMLElement>;
            xmp: PreHTMLAttributes<HTMLPreElement>;
        }
        /**
         * @type {SVGElementTagNameMap}
         */
        interface SVGElementTags {
            animate: AnimateSVGAttributes<SVGAnimateElement>;
            animateMotion: AnimateMotionSVGAttributes<SVGAnimateMotionElement>;
            animateTransform: AnimateTransformSVGAttributes<SVGAnimateTransformElement>;
            circle: CircleSVGAttributes<SVGCircleElement>;
            clipPath: ClipPathSVGAttributes<SVGClipPathElement>;
            defs: DefsSVGAttributes<SVGDefsElement>;
            desc: DescSVGAttributes<SVGDescElement>;
            ellipse: EllipseSVGAttributes<SVGEllipseElement>;
            feBlend: FeBlendSVGAttributes<SVGFEBlendElement>;
            feColorMatrix: FeColorMatrixSVGAttributes<SVGFEColorMatrixElement>;
            feComponentTransfer: FeComponentTransferSVGAttributes<SVGFEComponentTransferElement>;
            feComposite: FeCompositeSVGAttributes<SVGFECompositeElement>;
            feConvolveMatrix: FeConvolveMatrixSVGAttributes<SVGFEConvolveMatrixElement>;
            feDiffuseLighting: FeDiffuseLightingSVGAttributes<SVGFEDiffuseLightingElement>;
            feDisplacementMap: FeDisplacementMapSVGAttributes<SVGFEDisplacementMapElement>;
            feDistantLight: FeDistantLightSVGAttributes<SVGFEDistantLightElement>;
            feDropShadow: FeDropShadowSVGAttributes<SVGFEDropShadowElement>;
            feFlood: FeFloodSVGAttributes<SVGFEFloodElement>;
            feFuncA: FeFuncSVGAttributes<SVGFEFuncAElement>;
            feFuncB: FeFuncSVGAttributes<SVGFEFuncBElement>;
            feFuncG: FeFuncSVGAttributes<SVGFEFuncGElement>;
            feFuncR: FeFuncSVGAttributes<SVGFEFuncRElement>;
            feGaussianBlur: FeGaussianBlurSVGAttributes<SVGFEGaussianBlurElement>;
            feImage: FeImageSVGAttributes<SVGFEImageElement>;
            feMerge: FeMergeSVGAttributes<SVGFEMergeElement>;
            feMergeNode: FeMergeNodeSVGAttributes<SVGFEMergeNodeElement>;
            feMorphology: FeMorphologySVGAttributes<SVGFEMorphologyElement>;
            feOffset: FeOffsetSVGAttributes<SVGFEOffsetElement>;
            fePointLight: FePointLightSVGAttributes<SVGFEPointLightElement>;
            feSpecularLighting: FeSpecularLightingSVGAttributes<SVGFESpecularLightingElement>;
            feSpotLight: FeSpotLightSVGAttributes<SVGFESpotLightElement>;
            feTile: FeTileSVGAttributes<SVGFETileElement>;
            feTurbulence: FeTurbulanceSVGAttributes<SVGFETurbulenceElement>;
            filter: FilterSVGAttributes<SVGFilterElement>;
            foreignObject: ForeignObjectSVGAttributes<SVGForeignObjectElement>;
            g: GSVGAttributes<SVGGElement>;
            image: ImageSVGAttributes<SVGImageElement>;
            line: LineSVGAttributes<SVGLineElement>;
            linearGradient: LinearGradientSVGAttributes<SVGLinearGradientElement>;
            marker: MarkerSVGAttributes<SVGMarkerElement>;
            mask: MaskSVGAttributes<SVGMaskElement>;
            metadata: MetadataSVGAttributes<SVGMetadataElement>;
            mpath: MPathSVGAttributes<SVGMPathElement>;
            path: PathSVGAttributes<SVGPathElement>;
            pattern: PatternSVGAttributes<SVGPatternElement>;
            polygon: PolygonSVGAttributes<SVGPolygonElement>;
            polyline: PolylineSVGAttributes<SVGPolylineElement>;
            radialGradient: RadialGradientSVGAttributes<SVGRadialGradientElement>;
            rect: RectSVGAttributes<SVGRectElement>;
            set: SetSVGAttributes<SVGSetElement>;
            stop: StopSVGAttributes<SVGStopElement>;
            svg: SvgSVGAttributes<SVGSVGElement>;
            switch: SwitchSVGAttributes<SVGSwitchElement>;
            symbol: SymbolSVGAttributes<SVGSymbolElement>;
            text: TextSVGAttributes<SVGTextElement>;
            textPath: TextPathSVGAttributes<SVGTextPathElement>;
            tspan: TSpanSVGAttributes<SVGTSpanElement>;
            use: UseSVGAttributes<SVGUseElement>;
            view: ViewSVGAttributes<SVGViewElement>;
        }

        export interface IntrinsicElements
            extends HTMLElementTags,
                HTMLElementDeprecatedTags,
                SVGElementTags {}
    }
}
