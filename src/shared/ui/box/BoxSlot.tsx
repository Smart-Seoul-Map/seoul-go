import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

type SlotProps = Record<string, unknown> & {
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
  className?: string;
  style?: CSSProperties;
};

function attachRef(ref: Ref<HTMLElement> | undefined, element: HTMLElement | null): () => void {
  if (typeof ref === "function") {
    const dispose = ref(element);
    return () => {
      if (typeof dispose === "function") dispose();
      else ref(null);
    };
  }
  if (ref) ref.current = element;
  return () => {
    if (ref) ref.current = null;
  };
}

export function BoxSlot({ children, ref, ...props }: SlotProps): ReactElement {
  const child = Children.only(children);
  if (!isValidElement<SlotProps>(child)) throw new Error("AppBox asChild requires one element.");
  const merged = { ...props, ...child.props };
  for (const key of Object.keys(props)) {
    const parentHandler = props[key];
    const childHandler = child.props[key];
    if (
      !/^on[A-Z]/.test(key) ||
      typeof parentHandler !== "function" ||
      typeof childHandler !== "function"
    )
      continue;
    merged[key] = (...args: unknown[]) => {
      childHandler(...args);
      parentHandler(...args);
    };
  }
  return cloneElement(child, {
    ...merged,
    className: [props.className, child.props.className].filter(Boolean).join(" "),
    style: { ...props.style, ...child.props.style },
    ref: (element: HTMLElement | null) => {
      const cleanups = [attachRef(ref, element), attachRef(child.props.ref, element)];
      return () => cleanups.forEach((cleanup) => cleanup());
    },
  });
}
