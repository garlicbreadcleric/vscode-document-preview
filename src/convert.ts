import { exec, ExecOptions } from "child_process";
import path = require("path");

export type ConvertInput = {
    source: string;
    command: string;
    filePath: string;
};
export type ConvertResultOk = {
    status: "ok";
    body: string;
};
export type ConvertResultError = {
    status: "error";
    message: string;
};
export type ConvertResult = ConvertResultOk | ConvertResultError;

export async function convert(input: ConvertInput): Promise<ConvertResult> {
    try {
        const body = await execCmd(input.command, input.source, { cwd: path.dirname(input.filePath) });
        return { status: "ok", body };
    } catch (e: any) {
        return { status: "error", message: e.toString() };
    }
}

async function execCmd(cmd: string, input: string, options: ExecOptions): Promise<string> {
    return await new Promise((resolve, reject) => {
        const p = exec(
            cmd,
            options,
            (err, stdout, stderr) => {
                if (err) {
                    console.error(stderr);
                    reject(err);
                }
                resolve(stdout);
            }
        );
        p.stdin?.setDefaultEncoding("utf-8");
        p.stdin?.write(input);
        p.stdin?.end();
    });
}