// ============================================================
// LOT 1 — FILTRE DES DATES PASSÉES + ARCHIVAGE AUTO
// À coller à la fin de code.gs (NE PAS supprimer le code existant)
// ============================================================
// Installation :
// 1. Colle ce fichier à la fin de code.gs
// 2. Colle AUSSI code-solo-addition.gs : c'est lui qui contient désormais
//    la version à jour de getSoloWeekends() (filtre dates passées inclus)
//    ainsi que SOLO_CONFIG. Supprime toute ancienne copie de getSoloWeekends()
//    pour éviter les doublons de définition.
// 3. Ajoute le filtre isPastSlot() dans getWeekends() et dans la fonction
//    utilisée par vacances.html (voir "MODIFIER" ci-dessous)
// 4. VÉRIFIE LOT1_CONFIG ci-dessous : nom de colonne de la date de fin pour
//    chaque feuillet. archivePastRows() refuse de supprimer quoi que ce soit
//    si l'en-tête ne correspond pas (garde-fou anti-suppression massive).
// 5. Lance setupLot1() UNE FOIS depuis l'éditeur (autorise les droits demandés)
// 6. Redéploie : Déployer → Gérer les déploiements → ✏️ Modifier →
//    Version : "Nouvelle version" → Déployer
//    ⚠️ Bien MODIFIER le déploiement existant (pas "Nouveau déploiement"),
//    sinon l'URL /exec change et les sites cassent.
// ============================================================

// ------------------------------------------------------------
// CONFIG ARCHIVAGE
// Pour chaque feuillet :
//  - dateFinCol       : la colonne qui contient la DATE DE FIN (A=1, B=2, C=3...)
//  - dateFinHeaders   : les libellés d'en-tête acceptés pour CETTE colonne.
//    Si l'en-tête réel n'est pas dans la liste, le feuillet est IGNORÉ
//    (log + abort) : on ne supprime jamais de lignes sur une colonne incertaine.
// ------------------------------------------------------------
const LOT1_CONFIG = {
  archiveSheetName: 'Archive',
  sheets: [
    { name: 'Reservations', dateFinCol: 3, dateFinHeaders: ['Date fin', 'Date de fin', 'Fin'] },
    { name: 'Solo',         dateFinCol: 3, dateFinHeaders: ['Date fin', 'Date de fin', 'Fin'] },
    { name: 'Vacances',     dateFinCol: 3, dateFinHeaders: ['Date fin', 'Date de fin', 'Fin'] },
  ],
};

// ------------------------------------------------------------
// HELPER — un créneau est "passé" si sa date de fin est avant aujourd'hui
// ------------------------------------------------------------
function isPastSlot(dateFin) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fin = new Date(dateFin);
  fin.setHours(0, 0, 0, 0);
  return fin < today;
}

// ============================================================
// MODIFIER getWeekends() (weekends groupe, index.html)
// Dans la boucle qui construit la liste des weekends disponibles,
// ajoute cette ligne juste après la lecture de la date de fin :
//
//   if (isPastSlot(dateFin)) continue;
//
// (adapte le nom de la variable à ton code existant)
// ============================================================

// ============================================================
// MODIFIER la fonction getAll() utilisée par vacances.html
// Même principe : dans la boucle, ignorer les lignes dont la
// date de fin est passée :
//
//   if (isPastSlot(dateFin)) continue;
// ============================================================

// ============================================================
// getSoloWeekends() : plus de copie ici.
// La version canonique (filtre dates passées + conflits groupe factorisés)
// vit dans code-solo-addition.gs. Ne recolle pas l'ancienne version :
// deux définitions du même nom dans un projet Apps Script, c'est la dernière
// chargée qui gagne — source de bugs silencieux.
// ============================================================

// ------------------------------------------------------------
// GARDE-FOU — l'en-tête de la colonne date de fin doit correspondre
// à ce qu'on attend AVANT d'autoriser la moindre suppression.
// Retourne true si le feuillet peut être archivé.
// ------------------------------------------------------------
function canArchiveSheet(sheet, cfg) {
  const lastCol = sheet.getLastColumn();
  if (cfg.dateFinCol > lastCol) {
    Logger.log(
      'ARCHIVAGE ABORTÉ [' + cfg.name + '] : colonne ' + cfg.dateFinCol +
      ' hors du feuillet (' + lastCol + ' colonnes).'
    );
    return false;
  }

  const header = String(sheet.getRange(1, cfg.dateFinCol).getValue()).trim();
  const expected = cfg.dateFinHeaders || [];
  const matches = expected.some(function (name) {
    return name.toLowerCase() === header.toLowerCase();
  });

  if (!matches) {
    Logger.log(
      'ARCHIVAGE ABORTÉ [' + cfg.name + '] : en-tête colonne ' + cfg.dateFinCol +
      ' = "' + header + '", attendu l\'un de [' + expected.join(', ') + ']. ' +
      'Corrige LOT1_CONFIG ou la Sheet avant de relancer.'
    );
    return false;
  }

  return true;
}

// ============================================================
// ARCHIVAGE AUTO — déplace les lignes passées vers l'onglet Archive
// Tourne chaque nuit via le trigger installé par setupLot1()
// ============================================================
function archivePastRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Créer l'onglet Archive s'il n'existe pas
  let archive = ss.getSheetByName(LOT1_CONFIG.archiveSheetName);
  if (!archive) {
    archive = ss.insertSheet(LOT1_CONFIG.archiveSheetName);
    archive.appendRow(['Feuillet source', 'Archivé le', '→ données de la ligne originale']);
  }

  LOT1_CONFIG.sheets.forEach(function (cfg) {
    const sheet = ss.getSheetByName(cfg.name);
    if (!sheet) return; // feuillet absent : on ignore

    // Garde-fou : jamais de suppression si la colonne n'est pas celle attendue
    if (!canArchiveSheet(sheet, cfg)) return;

    const data = sheet.getDataRange().getValues();
    const rowsToDelete = [];

    for (let i = 1; i < data.length; i++) {
      const dateFin = data[i][cfg.dateFinCol - 1];
      if (!dateFin) continue; // ligne sans date : on ne touche pas
      if (!isPastSlot(dateFin)) continue;

      // Copier vers Archive avec la provenance et la date d'archivage
      archive.appendRow([cfg.name, new Date()].concat(data[i]));
      rowsToDelete.push(i + 1); // index de ligne réel dans la Sheet
    }

    // Supprimer de bas en haut pour ne pas décaler les index
    for (let d = rowsToDelete.length - 1; d >= 0; d--) {
      sheet.deleteRow(rowsToDelete[d]);
    }

    if (rowsToDelete.length > 0) {
      Logger.log('Archivage [' + cfg.name + '] : ' + rowsToDelete.length + ' ligne(s) déplacée(s).');
    }
  });
}

// ============================================================
// SETUP — à lancer UNE FOIS depuis l'éditeur Apps Script
// Installe le trigger quotidien (entre 4h et 5h du matin)
// ============================================================
function setupLot1() {
  // Supprimer un éventuel ancien trigger pour éviter les doublons
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'archivePastRows') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('archivePastRows')
    .timeBased()
    .everyDays(1)
    .atHour(4)
    .create();

  // Premier passage immédiat pour nettoyer l'existant
  archivePastRows();

  Logger.log('Lot 1 installé : trigger quotidien à 4h + premier archivage effectué.');
}
