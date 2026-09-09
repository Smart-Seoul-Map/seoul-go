import type { ComponentPropsWithRef, CSSProperties, ElementType } from "react";

export type BoxBreakpoint = "base" | "sm" | "md" | "lg" | "xl";
export type BoxResponsiveValue<T> = T | Partial<Record<BoxBreakpoint, T>>;
export type BoxDimension = string | 0;
type ResponsiveDimension = BoxResponsiveValue<BoxDimension>;
type Sides = "Top" | "Right" | "Bottom" | "Left";
type Corners = "TopLeft" | "TopRight" | "BottomRight" | "BottomLeft";
type PaddingKey =
  "padding" | `padding${Sides | "X" | "Y"}` | "p" | "px" | "py" | "pt" | "pr" | "pb" | "pl";
type MarginKey =
  "margin" | `margin${Sides | "X" | "Y"}` | "m" | "mx" | "my" | "mt" | "mr" | "mb" | "ml";
type BleedKey = "bleed" | `bleed${Sides | "X" | "Y"}`;
type MarginProps = Partial<Record<MarginKey, ResponsiveDimension>>;
type BleedProps = Partial<Record<BleedKey, ResponsiveDimension>>;

export type BoxStyleProps = {
  bg?: string;
  background?: string;
  bgGradient?: string;
  backgroundGradient?: string;
  bgGradientDirection?: string;
  backgroundGradientDirection?: string;
  color?: string;
  borderColor?: string;
  boxShadow?: string;
  display?: BoxResponsiveValue<
    "block" | "flex" | "grid" | "inline-flex" | "inline" | "inline-block" | "none"
  >;
  position?: "relative" | "absolute" | "fixed" | "sticky";
  overflowX?: CSSProperties["overflowX"];
  overflowY?: CSSProperties["overflowY"];
  zIndex?: CSSProperties["zIndex"];
  flexGrow?: number | true;
  flexShrink?: number | true;
  flexWrap?: CSSProperties["flexWrap"] | true;
  flexDirection?: BoxResponsiveValue<NonNullable<CSSProperties["flexDirection"]>>;
  justifyContent?: CSSProperties["justifyContent"];
  justifySelf?: CSSProperties["justifySelf"];
  alignItems?: CSSProperties["alignItems"];
  alignContent?: CSSProperties["alignContent"];
  alignSelf?: CSSProperties["alignSelf"];
  gap?: ResponsiveDimension;
  gridColumn?: string;
  gridRow?: string;
  unstable_transform?: string;
  _active?: { bg?: string; background?: string };
} & Partial<
  Record<
    "width" | "minWidth" | "maxWidth" | "height" | "minHeight" | "maxHeight",
    BoxResponsiveValue<string>
  >
> &
  Partial<Record<"top" | "right" | "bottom" | "left", BoxDimension>> &
  Partial<Record<"borderWidth" | `border${Sides}Width`, 0 | 1 | string>> &
  Partial<Record<"borderRadius" | `border${Corners}Radius`, BoxDimension>> &
  Partial<Record<PaddingKey, ResponsiveDimension>> &
  (
    | (MarginProps & Partial<Record<BleedKey, never>>)
    | (BleedProps & Partial<Record<MarginKey, never>>)
  );

export type AppBoxProps = BoxStyleProps &
  Omit<ComponentPropsWithRef<"div">, "color"> & {
    as?: ElementType;
    asChild?: boolean;
    hideFrom?: Exclude<BoxBreakpoint, "base">;
  };
