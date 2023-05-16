const { window, workspace, StatusBarAlignment } = require('vscode');

function escapeRegExp(str) {
	return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function getAlignmentValue(config) {
	const alignment = config.get('alignment');
	return alignment === StatusBarAlignment[StatusBarAlignment.Left].toLowerCase()
        ? StatusBarAlignment.Left
        : StatusBarAlignment.Right;
}

function getPriorityValue(config) {
	return Number(config.get('priority'));
}

function getCaseSensitiveValue(config) {
	return config.get('caseSensitive') || false;
}

function getWholeWordMatchingValue(config) {
	return config.get('wholeWordMatching') || false;
}

function getWordSeparatorsValue(config) {
	let wordSeparators = config.get('wordSeparators');
	if (wordSeparators) return wordSeparators;

	wordSeparators = workspace.getConfiguration('editor').get('wordSeparators');
	return wordSeparators ? wordSeparators : '';
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const config = workspace.getConfiguration('highlight-selection');

	const alignment = getAlignmentValue(config);
  const priority = getPriorityValue(config);
  const caseSensitive = getCaseSensitiveValue(config);
  const wholeWordMatching = getWholeWordMatchingValue(config);
  const wordSeparators = getWordSeparatorsValue(config);

	const msg = window.createStatusBarItem(alignment, priority);

	let matchFlags = 'gi';
	if (caseSensitive) {
		matchFlags = 'g';
	}

	const decorationTypes = {};
	let match;
	let counter = 0;

	window.onDidChangeTextEditorSelection(() => {
		counter = 0;
		const editor = window.activeTextEditor;

		if (editor) {
			let text = editor.document.getText(editor.selection);

			if (text.length >= 1 && text.indexOf('\n') === -1) {
				text = escapeRegExp(text);

				if (wholeWordMatching) {
					const boundaryRegex = wordSeparators ? `[${escapeRegExp(wordSeparators)}]|\\s` : '\\b';
          text = `(?<=^|${boundaryRegex})${text}(?=$|${boundaryRegex})`;
				}

				const pattern = new RegExp(text, matchFlags);

				while (match = pattern.exec(editor.document.getText())) {
					var startPos = editor.document.positionAt(match.index);
					var endPos = editor.document.positionAt(match.index + match[0].length);

					console.log(match[0]);
					console.log(startPos, endPos);

					counter++;
				}

				if (counter) {
					console.log('highlight count: ', counter);
				} else if (msg) {
					msg.hide();
				}
			} else if (msg) {
				msg.hide();
			}
		} else if (msg) {
			msg.hide();
		}
	}, null, context.subscriptions);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
