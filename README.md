# PaperPen – Nettoyage intelligent de code

Extension VS Code pour nettoyer rapidement vos fichiers : suppression de lignes vides, commentaires, logs de debug, normalisation d'attributs HTML, etc.

## Fonctionnalités principales

- Effacer les lignes vides (même dans les blocs mixtes HTML/PHP/JS/CSS)
- Supprimer les commentaires mono-ligne (//, #, /* ... */ sur une ligne)
- Supprimer les commentaires multilignes (/* ... */ et <!-- ... -->)
- Effacer les commentaires inline (à droite du code, protégé dans les strings)
- PHP :
  - Supprimer ou remplacer `error_log(...)` par `echo 'ok';`
  - Supprimer ou remplacer `var_dump(...)` par `echo 'ok';`
  - Supprimer les lignes `echo 'ok';` ajoutées précédemment
- JavaScript :
  - Supprimer ou remplacer `console.log(...)` par `void(0);`
- HTML :
  - Ajouter automatiquement `type="button"` aux balises `<button>` sans type
  - Ajouter automatiquement `type="text"` aux balises `<input>` sans type
  - Supprimer le `/` final des balises auto-fermantes (ex: `<br/>` → `<br>`)

## Avertissement

**Faites toujours une sauvegarde avant d'utiliser PaperPen.**  
Les modifications sont appliquées directement et peuvent être difficiles à annuler si vous n'avez pas Ctrl+Z immédiatement.

Le # est pas concideré comme une annotation de commentaire,
pour raison technique. (A voir dans une prochaine version)

## Installation locale

1. Téléchargez le fichier .vsix
2. Dans VS Code : Extensions → … → Install from VSIX…
3. Rechargez la fenêtre VS Code

## Utilisation

- Ou : `Ctrl + Shift + P` → tapez « PaperPen » → « PaperPen: Nettoyage du fichier »

### 1.0.5
- Ajout de l'option "Effacer les echo 'ok';"
- Suppression définitive de la détection du # comme commentaire
- Compteurs détaillés dans le message final

# PaperPen

Créé par **Kane**  
Extension VS Code pour nettoyer rapidement le code : suppression de commentaires, logs de debug, normalisation d’attributs HTML, etc.

--------
