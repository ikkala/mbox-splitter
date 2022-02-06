import {
    parse,
    BufReader,
    ensureDirSync,
    existsSync,
    join,
    basename,
    TextProtoReader,
} from "./deps.ts";
import { parseMboxFile } from "./mbox-parser.ts";

const argOptions = {
    string: [
        "inputFile",
        "outputDir",
        "categoryHeader",
        "defaultCategories",
        "excludedCategoryPrefixes",
    ],
    boolean: [
        "help",
    ],
    alias: {
        "i": "inputFile",
        "o": "outputDir",
    },
    default: {
        "categoryHeader": "X-Gmail-Labels",
        "defaultCategories": "Archived,Inbox,Sent",
        "excludedCategoryPrefixes": "Opened,Unread,Important,Starred,Category",
    }
};
const commandLineArgs = parse(Deno.args, argOptions);

if (commandLineArgs.help) {
    const __filename = basename(new URL('', import.meta.url).pathname);
    console.log(
`
mbox-splitter splits mbox formatted email files to separate files that are
named by categories found from the emails.

The categories are defined by using header information available in emails.
By default, the header used to determine the category of the email
is "${argOptions.default.categoryHeader}".

Usage:
        mbox-splitter [arguments] -i "mbox-file-to-be-splitted.mbox" -o "non-existing/output/directory"

Note for opening the output in Thunderbird:
    To make Thunderbird handle the output as email folder structure,
    you should name the output directory by ".sbd" extension and on same
    level than the actual directory, create empty file by same name than
    the directory but without the ".sbd" extension.    

Available arguments:`, argOptions, `

Arguments parsed from the currently given command-line:`, commandLineArgs);
    Deno.exit(0);
}

const inputFile = commandLineArgs.inputFile;
const outputDir = commandLineArgs.outputDir;

if (!inputFile) {
    console.error("--inputFile not defined");
    Deno.exit(-1);
}
if (!existsSync(inputFile)) {
    console.error("File not found: " + inputFile);
    Deno.exit(-1);
}
if (!outputDir) {
    console.error("--outputDir not defined");
    Deno.exit(-1);
}
if (existsSync(outputDir)) {
    console.error("File/folder already exists: " + outputDir);
    Deno.exit(-1);
}

ensureDirSync(outputDir);

const categoryHeader = commandLineArgs.categoryHeader as string;

const defaultCategories = (commandLineArgs.defaultCategories as string).split(",").map(c => c.trim());
const excludedCategoryPrefixes = (commandLineArgs.excludedCategoryPrefixes as string).split(',').map(c => c.trim());
defaultCategories.forEach(c => excludedCategoryPrefixes.push(c));

function storeMail(folderName: string, mailContent: string) {
    if (mailContent.length > 0 && folderName.length > 0) {
        Deno.writeTextFileSync(join(outputDir, folderName), mailContent, { append: true });
    }
}

const file = await Deno.open(inputFile, { read: true, write: false });
const bufReader = BufReader.create(file);
const reader = new TextProtoReader(bufReader);

await parseMboxFile({
    reader,
    categoryHeader,
    excludedCategoryPrefixes,
    defaultCategories,
    handleParsedMail: storeMail,
});
