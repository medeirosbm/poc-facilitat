import Image from "next/image";
import { Document, Packer, Paragraph, TextRun , Table, TableRow, TableCell} from "docx";
//import { FileChild } from "./file-child";
import * as fs from "fs";
import { JSONToHTML } from 'html-to-json-parser'; // ES6
import internal from "stream";

class TextRunCOMP {
  italics: boolean;
  bold: boolean;
  text: string;
  underline: object |null;

  constructor(options: { italics?: boolean; bold?: boolean; text: string, underline?: object}) {
    this.italics = options.italics || false;
    this.bold = options.bold || false;
    this.text = options.text;
    this.underline = options.underline || null;
  }

   build = (): TextRun =>{
    if(this.underline)
      return new TextRun({ text: this.text, italics: this.italics, bold:this.bold,underline: this.underline });
    else
      return new TextRun({ text: this.text, italics: this.italics, bold:this.bold });
  }
}

class ParagraphCOMP {
  children: TextRunCOMP[];

  constructor(options: { children: TextRunCOMP[] }) {
    this.children = options.children;
  }
  build = (): Paragraph =>{
    return new Paragraph({ children: this.children.map(child=>{return child.build()}) });
  }
}

class TableCOMP {
  rows: TableRowCOMP[];

  constructor(options: { rows: TableRowCOMP[] }) {
    this.rows = options.rows;
  }
  build = (): Table =>{
    return new Table({ rows: this.rows.map(child=>{return child.build()}) });
  }
}
class TableRowCOMP {
  children: TableCellCOMP[];

  constructor(options: { children: TableCellCOMP[] }) {
    this.children = options.children;
  }
  build = (): TableRow =>{
    return new TableRow({ children: this.children.map(child=>{return child.build()}) });
  }
}

class TableCellCOMP {
  children: (ParagraphCOMP | TableCOMP)[];
  columnSpan?: number;
  rowSpan?: number;
  //pct
  width?: string;
  constructor(options: { children: (ParagraphCOMP | TableCOMP)[] }) {
    this.children = options.children;
  }
  build = (): TableCell =>{
    return new TableCell({ children: this.children.map(child=>{return child.build()}) });
  }
}

class DocumentCOMP {
  properties: {};
  children: ParagraphCOMP[];
  constructor(options: { properties: {}; children: ParagraphCOMP[] }) {
    this.properties = options.properties;
    this.children = options.children;
  }

  build = (): Document =>{
    return new Document({ sections:[{
        properties:{}, children: this.children.map(child=>{return child.build()}) 
      }]
    });
  }

}
function convertToDocumentCOMP(input: any): DocumentCOMP  {

    const content = convertContent([input]);
    return new DocumentCOMP(
        {
          properties: {},
          children: content,
        },
    );
}


function convertContent(content: any[]): any[] {

  return content.map((input)=>{
    
    if (typeof input === "string") {
      return new TextRunCOMP({ text: input });
    } else if (input.type === "p") {
      const children = convertContent(input.content).flat();
      return  new ParagraphCOMP({
        children: children,
      });
    }
    else if (input.type === "strong") {

      let boldText = convertContent(input.content)
      boldText = boldText.flat();
      boldText = boldText.map((textRun)=>{
        textRun.bold = true;
        return textRun;
      });
      return boldText;
    }else if (input.type === "i") {

      let italicsText = convertContent(input.content)
      italicsText = italicsText.flat();

      italicsText = italicsText.map((textRun)=>{
        textRun.italics = true;
        return textRun;
      });
      return italicsText;
    }else if (input.type === "u") {

      let underlineText = convertContent(input.content)
      underlineText = underlineText.flat();
      underlineText = underlineText.map((textRun)=>{
        textRun.underline = {};
        return textRun;
      });
      return underlineText

    }
    else  if (input.type === "table") {
      const rows = convertContent(input.content).flat();
      return  new TableCOMP({
        rows: rows,
      });
    }else if (input.type === "tr") {
        const children = convertContent(input.content).flat();
        return  new TableRowCOMP({
          children: children,
        });
    }else if (input.type === "td") {


      const children = convertContent(input.content).flat();
     
      const result =  new TableCellCOMP({
        children: children,
      });

      // verify the style
      if(input.content.attributes && input.content.attributes.style){
        if(input.content.attributes.style.indexOf("width: ")){
          //"attributes": { "style": "width: 14.2857%;" }
          const value = input.content.attributes.style.substr(input.content.attributes.style.indexOf("width: ")+ 7,input.content.attributes.style.indexOf("%"));
          result.width = value;
        }
      }
      if(input.content.attributes && input.content.attributes.rowspan){
        result.rowSpan = input.content.attributes.rowspan;
      }
      if(input.content.attributes && input.content.attributes.colspan){
        result.rowSpan = input.content.attributes.colspan;
      }

      return result;
    }else
    {
      console.log("maybe table tag")
    }
  });
  
}

export default function Home() {
  
// Example input JSON
const inputJSON = {
  type: "p",
  content: [
    {
      type: "strong",
      content: [
        { type: "i", content: ["Lorem"] },
        " ",
        { type: "u", content: ["ipsum"] },
        " dolor",
      ],
    },
    " Maecenas imperdiet sapien lorem. ",
  ],
};

const inputJSON2 = 
{
  "type": "table",
  "content": [
    {
      "type": "tbody",
      "content": [
        "\n",
        {
          "type": "tr",
          "content": [
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 28.5714%;", "colspan": "2" }
            },
            "\n\t\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 12.2503%;" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": {
                "style": "width: 16.3512%; border-color: rgb(204, 0, 0);"
              }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.3007%;", "rowspan": "2" }
            }
          ]
        },
        "\n",
        {
          "type": "tr",
          "content": [
            "\n\t",
            {
              "type": "td",
              "content": [
                {
                  "type": "a",
                  "content": ["Google"],
                  "attributes": {
                    "href": "https://www.google.com",
                    "target": "_blank"
                  }
                },
                { "type": "br" }
              ],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            { "type": "td", "content": [{ "type": "br" }] },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "border-color: rgb(204, 0, 0);" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t"
          ]
        },
        "\n",
        {
          "type": "tr",
          "content": [
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            { "type": "td", "content": [{ "type": "br" }] },
            "\n\t",
            { "type": "td", "content": [{ "type": "br" }] },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            {
              "type": "td",
              "content": [{ "type": "br" }],
              "attributes": { "style": "width: 14.2857%;" }
            },
            "\n\t",
            { "type": "td", "content": [{ "type": "br" }] }
          ]
        }
      ]
    }
  ],
  "attributes": { "style": "border-collapse:collapse;width: 100%;" }
};

// Convert to Document object
const docCOMP  = convertToDocumentCOMP(inputJSON2);
const doc = docCOMP.build();
//console.log(doc)
/* const doc = new Document({
  sections: [
      {
          properties: {},
          children: [
              new Paragraph({
                  children: [
                      new TextRun("Hello World"),
                      new TextRun({
                          text: "Foo Bar",
                          bold: true,
                      }),
                      new TextRun({
                          text: "\tGithub is the best",
                          bold: true,
                      }),
                  ],
              }),
          ],
      },
  ],
});*/

/*
{"type":"table","content":[{"type":"tbody","content":[{"type":"tr","content":[{"type":"td","content":["a"],"attributes":{"style":"width: 20%; background-color: rgb(255, 153, 0);"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%; background-color: rgb(255, 153, 0);"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%; background-color: rgb(255, 153, 0);"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%; background-color: rgb(255, 153, 0);"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%; background-color: rgb(255, 153, 0);"}}]},{"type":"tr","content":[{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}}]},{"type":"tr","content":[{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}},{"type":"td","content":["a"],"attributes":{"style":"width: 20%;"}}]}]}],"attributes":{"style":"border-collapse:collapse;width: 100%;"}}

*/
  // Used to export the file into a .docx file
  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Testing.docx", buffer);
  });


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" "}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Docs{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Learn{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Templates{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Explore starter templates for Next.js.
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Deploy{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50 text-balance`}>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
    </main>
  );
}
