# mbox-splitter

mbox-splitter splits mbox formatted email files to separate files that are
named by categories found from the emails.

The categories are defined by using header information available in emails.
By default, the header used to determine the category of the email
is "X-Gmail-Labels".

Usage:
```
mbox-splitter [arguments] -i "mbox-file-to-be-splitted.mbox" -o "non-existing/output/directory"
```

> Note for opening the output in Thunderbird:
    To make Thunderbird handle the output as email folder structure,
    you should name the output directory by ".sbd" extension and on same
    level than the actual directory, create empty file by same name than
    the directory but without the ".sbd" extension.    
