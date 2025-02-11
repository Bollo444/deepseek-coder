// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand('deepseek-coder.helloWorld', () => {
    const panel = vscode.window.createWebviewPanel(
        'deepseek-coder',
        'DeepSeek Chat',
        vscode.ViewColumn.One,
        { enableScripts: true }
     );

    panel.webview.html = getWebviewContent();

    let responseText = ''; // Define responseText variable

    panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === 'chat') {
            const userPrompt = message.text;
            let response = '';

            try {
                const streamResponse = await ollama.chat({
                    model: 'deepseek-r1:1.5b',
                    messages: [{ role: 'user', content: userPrompt }],
                    stream: true,
                });

                for await (const chunk of streamResponse) {
                    responseText += chunk.message.content;
                    panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                }
            } catch (err) {
                console.error('Error during chat completion:', err);
                panel.webview.postMessage({ command: 'chatResponse', text: 'Error during chat completion. Please check the console for details.' });
            }
        }
    });
  });

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "deepseek-coder" is now active!');

  // Push disposable to context subscriptions to ensure cleanup
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(): string {
    return /*html*/`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
            body {font-family: sans-serif; margin: 1rem;}
            #prompt {width: 100%; box-sizing: border-box; }
            #response {border: 1px solid #ccc; padding: 1rem; margin-top: 1rem; padding: 0.5rem; min-height: 100px;}
            </style>
        </head>
        <body>
            <h2>Deep Seek Chat</h2>
            <textarea id="prompt" rows="3" placeholder="Enter your prompt here..."></textarea><br />
            <button id="askbtn">Ask</button>
            <div id="response"></div>

            <script>
                const vscode = acquireVsCodeApi();

                document.getElementById('askbtn').addEventListener('click', () => {
                    const text = document.getElementById('prompt').value;
                    vscode.postMessage({ command: 'chat', text });
                });

                window.addEventListener('message', event => {
                    const message = event.data; // The JSON data our extension sent
                    if (message.command === 'chatResponse') {
                        document.getElementById('response').innerText = message.text;
                    }
                });
            </script>
        </body>
        </html>
    `;
}
