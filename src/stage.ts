/**
 * The 3D scene and everything it pulls in (three, fiber, drei, postprocessing) is a separate
 * chunk: the title card paints without waiting for it, and the 2D fallback never downloads it.
 */
export const loadStage = () => import("./scene/Stage");
