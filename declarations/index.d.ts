
interface SourceConverterOption {
    dryRun: boolean;
    rootDirectory: string;
    saveAction: "override" | "override-all" |
                "rename" | "rename-all" |
                "skip" | "skip-all" |
                "cancel";
}
interface SourceItem {
    filepath: string;
    content: Buffer | string;
}