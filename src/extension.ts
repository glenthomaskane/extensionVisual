import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
        'paperpen.cleanComments',
        async (): Promise<void> => {
            const options: vscode.QuickPickItem[] = [
                {
                    label: "⚠️ Faites une sauvegarde de votre fichier avant tout traitement !",
                    picked: false,
                    kind: vscode.QuickPickItemKind.Separator
                },
                { label: 'Effacer les lignes vides' },
                { label: 'Effacer les commentaires sur une seule ligne' },
                { label: 'Effacer les commentaires multilignes (/* ... */ et <!-- ... -->)' },
                { label: 'Effacer les commentaires à droite du code (inline)' },
                { label: 'PHP', kind: vscode.QuickPickItemKind.Separator },
                { label: 'Supprimer les error_log' },
                { label: 'Remplacer error_log par echo \'ok\';' },
                { label: 'Supprimer les echo \'ok\';' },
                { label: 'Supprimer les var_dump' },
                { label: 'Remplacer var_dump par echo \'ok\';' },
                { label: 'JAVASCRIPT', kind: vscode.QuickPickItemKind.Separator },
                { label: 'Supprimer les console.log' },
                { label: 'Remplacer console.log par void(0);' },
                { label: 'HTML', kind: vscode.QuickPickItemKind.Separator },
                { label: 'Retablir button type="button"' },
                { label: 'Retablir input type="text"' },
                { label: 'Nettoyer balise auto-fermante (void tags)' }
            ];

            const selected = await vscode.window.showQuickPick(options, {
                canPickMany: true,
                placeHolder: 'Sélectionnez les options',
                title: 'Paperpen - Nettoyage'
            });

            if (!selected || selected.length === 0) {
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Aucun éditeur actif.');
                return;
            }

            const has = (txt: string): boolean =>
                selected.some(item => item.label.includes(txt));

            const config = {
                empty: has('lignes vides'),
                single: has('une seule ligne'),
                multilines: has('multilignes'),
                inline: has('inline'),
                errLog: has('error_log'),
                repErrLog: has("Remplacer error_log"),
                delEchoOk: has("echo 'ok';"),
                vDump: has('var_dump'),
                repVDump: has("Remplacer var_dump"),
                cLog: has('console.log'),
                repCLog: has("Remplacer console.log"),
                btn: has('button'),
                input: has('input'),
                selfClose: has('auto-fermante')
            };

            const document = editor.document;
            const edits = new vscode.WorkspaceEdit();

            // Compteurs pour le message final
            let countEmpty = 0;
            let countSingle = 0;
            let countMultilines = 0;
            let countErrLog = 0;
            let countVDump = 0;
            let countCLog = 0;
            let countEchoOk = 0;
            let countBtn = 0;
            let countInput = 0;
            let countSelfClose = 0;

            let inMultiLine = false;
            let inHtmlMultiLine = false;

            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const originalText = line.text;
                const trimmed = originalText.trim();
                let deleteLine = false;
                let newText = originalText;

                // Gestion multilignes JS/TS/PHP/CSS et HTML
                if (trimmed.includes('/*') || trimmed.includes('<!--')) {
                    inMultiLine = trimmed.includes('/*');
                    inHtmlMultiLine = trimmed.includes('<!--');
                }

                if (inMultiLine || inHtmlMultiLine) {
                    if (config.multilines) {
                        deleteLine = true;
                        countMultilines++;
                    }
                }

                if (trimmed.includes('*/') || trimmed.includes('-->')) {
                    inMultiLine = false;
                    inHtmlMultiLine = false;
                }

                // Lignes vides
                if (config.empty && trimmed === '') {
                    deleteLine = true;
                    countEmpty++;
                }

                // Commentaires mono-ligne (seulement si coché)
                if (!deleteLine && !inMultiLine && !inHtmlMultiLine && config.single) {
                    if (
                        trimmed.startsWith('//') ||
                        // trimmed.startsWith('#') ||   ← laissé en commentaire
                        (trimmed.startsWith('/*') && trimmed.endsWith('*/')) ||
                        (trimmed.startsWith('<!--') && trimmed.endsWith('-->'))
                    ) {
                        deleteLine = true;
                        countSingle++;
                    }
                }

                // Commentaires inline (seulement si coché)
                if (!deleteLine && config.inline) {
                    let inString: string | null = null;
                    let result = '';
                    for (let j = 0; j < newText.length; j++) {
                        const char = newText[j];
                        const next = newText[j + 1];
                        if (!inString && (char === '"' || char === "'" || char === '`')) {
                            inString = char;
                        } else if (inString && char === inString) {
                            inString = null;
                        }
                        if (!inString && char === '/' && next === '/') {
                            break;
                        }
                        result += char;
                    }
                    newText = result.trimEnd();
                }

                // Traitements si conservée
                if (!deleteLine) {
                    // error_log
                    if (config.errLog && /error_log\s*\(/.test(newText)) {
                        const regex = /error_log\s*\((?:[^()]*|\([^()]*\))*\);?/g;
                        if (config.repErrLog) {
                            newText = newText.replace(regex, "echo 'ok';");
                        } else {
                            deleteLine = true;
                            countErrLog++;
                        }
                    }

                    // Supprimer echo 'ok';
                    if (config.delEchoOk && /echo\s+'ok';\s*(\/\/.*)?$/.test(trimmed)) {
                        deleteLine = true;
                        countEchoOk++;
                    }

                    // var_dump
                    if (!deleteLine && config.vDump && /var_dump\s*\(/.test(newText)) {
                        const regex = /var_dump\s*\((?:[^()]*|\([^()]*\))*\);?/g;
                        if (config.repVDump) {
                            newText = newText.replace(regex, "echo 'ok';");
                        } else {
                            deleteLine = true;
                            countVDump++;
                        }
                    }

                    // console.log
                    if (!deleteLine && config.cLog && /console\.log\s*\(/.test(newText)) {
                        const regex = /console\.log\s*\((?:[^()]*|\([^()]*\))*\);?/g;
                        if (config.repCLog) {
                            newText = newText.replace(regex, 'void(0);');
                        } else {
                            deleteLine = true;
                            countCLog++;
                        }
                    }

                    // Rétablir button type = déplacer (ou ajouter) juste après <button, en gardant la valeur originale
                    if (config.btn) {
                        const oldText = newText;
                        newText = newText.replace(
                            /<button\b([^>]*)>/gi,
                            (match: string, attrs: string) => {
                                // Chercher la valeur actuelle de type (si présente)
                                const typeMatch = attrs.match(/\s+type\s*=\s*["']?([^"']*)["']?/i);
                                const typeValue = typeMatch ? typeMatch[1] : 'button'; // défaut button si absent

                                // Supprimer l’ancien attribut type (pour éviter doublon)
                                const cleanedAttrs = attrs.replace(/\s+type\s*=\s*["']?[^"']*["']?/gi, '').trim();

                                // Ajouter type juste après button avec sa valeur originale (ou défaut)
                                return `<button type="${typeValue}"${cleanedAttrs ? ' ' + cleanedAttrs : ''}>`;
                            }
                        );
                        if (newText !== oldText) {
                            countBtn++;
                        }
                    }

                    // Rétablir input type = déplacer (ou ajouter) juste après <input, en gardant la valeur originale
                    if (config.input) {
                        const oldText = newText;
                        newText = newText.replace(
                            /<input\b([^>]*)>/gi,
                            (match: string, attrs: string) => {
                                // Chercher la valeur actuelle de type (si présente)
                                const typeMatch = attrs.match(/\s+type\s*=\s*["']?([^"']*)["']?/i);
                                const typeValue = typeMatch ? typeMatch[1] : 'text'; // défaut text si absent

                                // Supprimer l’ancien attribut type
                                const cleanedAttrs = attrs.replace(/\s+type\s*=\s*["']?[^"']*["']?/gi, '').trim();

                                // Ajouter type juste après input avec sa valeur originale (ou défaut)
                                return `<input type="${typeValue}"${cleanedAttrs ? ' ' + cleanedAttrs : ''}>`;
                            }
                        );
                        if (newText !== oldText) {
                            countInput++;
                        }
                    }

                    // Nettoyer balises void
                    if (config.selfClose) {
                        const oldText = newText;
                        const voidTags = ['img', 'br', 'hr', 'meta', 'link', 'input'];
                        newText = newText.replace(
                            /<([a-zA-Z][a-zA-Z0-9]*)([^>]*)\s*\/>/g,
                            (match: string, tag: string, attrs: string) => {
                                if (voidTags.includes(tag.toLowerCase())) {
                                    return `<${tag}${attrs}>`;
                                }
                                return match;
                            }
                        );
                        if (newText !== oldText) {
                            countSelfClose++;
                        }
                    }
                }

                // Application des edits
                if (deleteLine) {
                    edits.delete(document.uri, line.rangeIncludingLineBreak);
                } else if (newText !== originalText) {
                    edits.replace(document.uri, line.range, newText);
                }
            }

            const success = await vscode.workspace.applyEdit(edits);
            if (success) {
                await document.save();

                // Message final avec compteurs
                const message = [
                    'Paperpen : Nettoyage terminé.',
                    `Lignes vides supprimées : ${config.empty ? countEmpty : '—'}`,
                    `Commentaires mono-ligne supprimés : ${config.single ? countSingle : '—'}`,
                    `Commentaires multilignes supprimés : ${config.multilines ? countMultilines : '—'}`,
                    `error_log supprimés : ${config.errLog && !config.repErrLog ? countErrLog : '—'}`,
                    `echo 'ok'; supprimés : ${config.delEchoOk ? countEchoOk : '—'}`,
                    `var_dump supprimés : ${config.vDump && !config.repVDump ? countVDump : '—'}`,
                    `console.log supprimés : ${config.cLog && !config.repCLog ? countCLog : '—'}`,
                    `button type rétablis : ${config.btn ? countBtn : '—'}`,
                    `input type rétablis : ${config.input ? countInput : '—'}`,
                    `balises auto-fermantes nettoyées : ${config.selfClose ? countSelfClose : '—'}`
                ].filter(Boolean).join('\n');

                vscode.window.showInformationMessage(message);
            }
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate(): void {}