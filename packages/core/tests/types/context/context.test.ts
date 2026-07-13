import type { ContextIdentity, Scope, Signal } from "../../../src/index.js";

type ThemeType = "dark" | "light";

declare const scope: Scope;
declare const themeContext: ContextIdentity<ThemeType>;

const theme: ThemeType = themeContext.get();

themeContext.provide(scope, "dark");

declare const reactiveThemeContext: ContextIdentity<Signal<ThemeType>>;
declare const themeSignal: Signal<ThemeType>;

reactiveThemeContext.provide(scope, themeSignal);

const reactiveTheme: Signal<ThemeType> = reactiveThemeContext.get();

// @ts-expect-error Provider values must match the context value type.
themeContext.provide(scope, "system");

// @ts-expect-error Context providers require a scope.
themeContext.provide({}, "light");

void reactiveTheme;
void theme;
