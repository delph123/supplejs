import { h } from "../../core";

export default function MockComponent({ children, ...props }) {
    return () => <div {...props}>{children}</div>;
}
