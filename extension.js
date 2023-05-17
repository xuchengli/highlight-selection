const { window, workspace, StatusBarAlignment, Range } = require('vscode');

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

function getBorderWidth(config) {
	return config.get('borderWidth');
}

function getBorderRadius(config) {
	return config.get('borderRadius');
}

function getBorderColor(config) {
	return config.get('borderColor');
}

function getBackgroundColor(config) {
	return config.get('backgroundColor');
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
	const borderWidth = getBorderWidth(config);
	const borderRadius = getBorderRadius(config);
	const borderColor = getBorderColor(config);
	const backgroundColor = getBackgroundColor(config);

	const msg = window.createStatusBarItem(alignment, priority);
	const decorationType = window.createTextEditorDecorationType({
		borderStyle: 'solid',
		borderWidth,
		borderRadius,
		borderColor,
		backgroundColor,
		color: 'black',
	});

	let matchFlags = 'gi';
	if (caseSensitive) {
		matchFlags = 'g';
	}

	let match;

	window.onDidChangeTextEditorSelection(() => {
		const editor = window.activeTextEditor;
		const ranges = [];

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
					const startPos = editor.document.positionAt(match.index);
					const endPos = editor.document.positionAt(match.index + match[0].length);

					ranges.push({ range: new Range(startPos, endPos) });
				}

				if (ranges.length) {
					msg.text = '高亮选中: ' + ranges.length;
					msg.show();
				} else if (msg) {
					msg.hide();
				}
			} else if (msg) {
				msg.hide();
			}
			editor.setDecorations(decorationType, ranges);
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
