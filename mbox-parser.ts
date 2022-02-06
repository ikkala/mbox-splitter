import {
    TextProtoReader,
} from "./deps.ts";

export async function parseMboxFile({
    reader,
    categoryHeader,
    excludedCategoryPrefixes,
    defaultCategories,
    handleParsedMail,
}: {
    reader: TextProtoReader,
    categoryHeader: string,
    excludedCategoryPrefixes: string[],
    defaultCategories: string[],
    handleParsedMail: (
        selectedCategoryName: string,
        mailContent: string
    ) => void,
}) {
    const fromHeader = "From ";
    if (!categoryHeader.endsWith(":")) {
        categoryHeader += ":";
    }
    categoryHeader += " ";

    let lineCount = 0;
    let mailCount = 0;

    let line: string | null;
    let mailContent = "";
    let selectedCategoryName = "";
    const categoryHeaderLen = categoryHeader.length;
    console.log("Reading data...");
    while ((line = await reader.readLine()) !== null) {
        if (line.startsWith(fromHeader)) {
            handleParsedMail(selectedCategoryName, mailContent);
            mailCount += 1;
            mailContent = "";
        } else if (line.startsWith(categoryHeader)) {
            const rawCategories = line.substring(categoryHeaderLen).split(",").sort();
            if (rawCategories.length === 0) {
                throw new Error("rawCategories.length === 0");
            }
            let hasOneOfDefaultCategories = "";
            const mailCategoriesAcceptableAsFolder = rawCategories.filter(c => {
                if (defaultCategories.some(dc => dc === c)) {
                    hasOneOfDefaultCategories = c;
                }
                return !excludedCategoryPrefixes.some(cp => c.startsWith(cp));
            });
            if (mailCategoriesAcceptableAsFolder.length > 0) {
                selectedCategoryName = mailCategoriesAcceptableAsFolder.join('&');
            } else if (mailCategoriesAcceptableAsFolder.length === 0 && hasOneOfDefaultCategories) {
                selectedCategoryName = hasOneOfDefaultCategories;
            } else {
                selectedCategoryName = defaultCategories[0];
            }
        }
        lineCount += 1;
        if (lineCount % 1000000 === 0) {
            console.log(`${lineCount} lines read, ${mailCount} mails found...`);
        }
        mailContent += (line + "\x0d\x0a");
    }
    handleParsedMail(selectedCategoryName, mailContent);
    console.log(`${lineCount} lines read, ${mailCount} mails found.`);
}
