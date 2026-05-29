/**
 * Yoga enums — ported from yoga-layout/src/generated/YGEnums.ts
 * Kept as `const` objects (not TS enums) per repo convention.
 * Values match upstream exactly so callers don't change.
 */

// Align 集中保存enums要一起传递的字段。
export const Align = {
  Auto: 0,
  FlexStart: 1,
  Center: 2,
  FlexEnd: 3,
  Stretch: 4,
  Baseline: 5,
  SpaceBetween: 6,
  SpaceAround: 7,
  SpaceEvenly: 8,
} as const
// Align 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Align = (typeof Align)[keyof typeof Align]

// BoxSizing 集中保存enums要一起传递的字段。
export const BoxSizing = {
  BorderBox: 0,
  ContentBox: 1,
} as const
// BoxSizing 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type BoxSizing = (typeof BoxSizing)[keyof typeof BoxSizing]

// Dimension 集中保存enums要一起传递的字段。
export const Dimension = {
  Width: 0,
  Height: 1,
} as const
// Dimension 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Dimension = (typeof Dimension)[keyof typeof Dimension]

// Direction 集中保存enums要一起传递的字段。
export const Direction = {
  Inherit: 0,
  LTR: 1,
  RTL: 2,
} as const
// Direction 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Direction = (typeof Direction)[keyof typeof Direction]

// Display 集中保存enums要一起传递的字段。
export const Display = {
  Flex: 0,
  None: 1,
  Contents: 2,
} as const
// Display 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Display = (typeof Display)[keyof typeof Display]

// Edge 集中保存enums要一起传递的字段。
export const Edge = {
  Left: 0,
  Top: 1,
  Right: 2,
  Bottom: 3,
  Start: 4,
  End: 5,
  Horizontal: 6,
  Vertical: 7,
  All: 8,
} as const
// Edge 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Edge = (typeof Edge)[keyof typeof Edge]

// Errata 集中保存enums要一起传递的字段。
export const Errata = {
  None: 0,
  StretchFlexBasis: 1,
  AbsolutePositionWithoutInsetsExcludesPadding: 2,
  AbsolutePercentAgainstInnerSize: 4,
  All: 2147483647,
  Classic: 2147483646,
} as const
// Errata 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Errata = (typeof Errata)[keyof typeof Errata]

// ExperimentalFeature 集中保存enums要一起传递的字段。
export const ExperimentalFeature = {
  WebFlexBasis: 0,
} as const
// ExperimentalFeature 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExperimentalFeature =
  (typeof ExperimentalFeature)[keyof typeof ExperimentalFeature]

// FlexDirection 集中保存enums要一起传递的字段。
export const FlexDirection = {
  Column: 0,
  ColumnReverse: 1,
  Row: 2,
  RowReverse: 3,
} as const
// FlexDirection 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type FlexDirection = (typeof FlexDirection)[keyof typeof FlexDirection]

// Gutter 集中保存enums要一起传递的字段。
export const Gutter = {
  Column: 0,
  Row: 1,
  All: 2,
} as const
// Gutter 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Gutter = (typeof Gutter)[keyof typeof Gutter]

// Justify 集中保存enums要一起传递的字段。
export const Justify = {
  FlexStart: 0,
  Center: 1,
  FlexEnd: 2,
  SpaceBetween: 3,
  SpaceAround: 4,
  SpaceEvenly: 5,
} as const
// Justify 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Justify = (typeof Justify)[keyof typeof Justify]

// MeasureMode 集中保存enums要一起传递的字段。
export const MeasureMode = {
  Undefined: 0,
  Exactly: 1,
  AtMost: 2,
} as const
// MeasureMode 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type MeasureMode = (typeof MeasureMode)[keyof typeof MeasureMode]

// Overflow 集中保存enums要一起传递的字段。
export const Overflow = {
  Visible: 0,
  Hidden: 1,
  Scroll: 2,
} as const
// Overflow 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Overflow = (typeof Overflow)[keyof typeof Overflow]

// PositionType 集中保存enums要一起传递的字段。
export const PositionType = {
  Static: 0,
  Relative: 1,
  Absolute: 2,
} as const
// PositionType 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type PositionType = (typeof PositionType)[keyof typeof PositionType]

// Unit 集中保存enums要一起传递的字段。
export const Unit = {
  Undefined: 0,
  Point: 1,
  Percent: 2,
  Auto: 3,
} as const
// Unit 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Unit = (typeof Unit)[keyof typeof Unit]

// Wrap 集中保存enums要一起传递的字段。
export const Wrap = {
  NoWrap: 0,
  Wrap: 1,
  WrapReverse: 2,
} as const
// Wrap 固化enums里传递的数据形状，帮助调用方按同一结构读写字段。
export type Wrap = (typeof Wrap)[keyof typeof Wrap]
