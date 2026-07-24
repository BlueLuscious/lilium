import {
    Compiler,
    type CompilerApi,
    type CompilerDiagnostic,
    type CompilerDiagnosticCodeType,
    type CompilerOptionsType,
    type CompilerOutput,
    type CompilerResult,
    type CompilerSourceMap,
    type CompilerSourcePosition,
    type CompilerSourceSpan,
} from "../../src/index.js";

const compiler: CompilerApi = Compiler;
declare const diagnostic: CompilerDiagnostic;
declare const output: CompilerOutput;
declare const result: CompilerResult;

const options: CompilerOptionsType = { filename: "src/counter.lily" };
const compiled: CompilerResult = compiler.compile("template {}", options);
const position: CompilerSourcePosition = { offset: 0, line: 1, column: 1 };
const span: CompilerSourceSpan = { start: position, end: position };
const map: CompilerSourceMap = {
    version: 3,
    file: "src/counter.lily.js",
    sources: ["src/counter.lily"],
    sourcesContent: ["template {}"],
    names: [],
    mappings: "",
};
const code: CompilerDiagnosticCodeType = "LILY3005";

void compiled;
void diagnostic;
void map;
void output;
void result;
void span;

// @ts-expect-error Compiler options require an explicit source filename.
compiler.compile("template {}", {});

// @ts-expect-error Compiler input is explicit source text rather than a file or URL object.
compiler.compile({ path: "counter.lily" }, options);

// @ts-expect-error Source-map version is fixed to version 3.
const invalidMap: CompilerSourceMap = { ...map, version: 4 };

// @ts-expect-error Diagnostic codes belong to the reserved first-milestone vocabulary.
const invalidCode: CompilerDiagnosticCodeType = "LILY9999";

void code;
void invalidCode;
void invalidMap;
