// ============================================================
// SOLO WEEKENDS — À AJOUTER dans code.gs (NE PAS supprimer le code existant)
// ============================================================
// Instructions :
// 1. Ouvre ton Apps Script lié à la Sheet
// 2. Colle CE CODE à la fin du fichier code.gs existant
// 3. Modifie doGet() et doPost() existants pour ajouter les nouvelles actions
//    (voir les commentaires "MODIFIER" ci-dessous)
// 4. Lance initSoloSheet() une fois depuis l'éditeur Apps Script
// 5. Redéploie le web app (New deployment ou Manage deployments → Edit)
// ============================================================

// ============================================================
// CONFIG SOLO
// ============================================================
const SOLO_CONFIG = {
  sheetName: 'Solo',
  hostName: 'Alex',
};

// ============================================================
// MODIFIER doGet() — Ajouter ce bloc dans le if/else existant :
// ============================================================
//
//   if (action === 'getSoloWeekends') {
//     return jsonResponse(getSoloWeekends());
//   }
//

// ============================================================
// MODIFIER doPost() — Remplacer le try/catch par :
// ============================================================
//
//   try {
//     const data = JSON.parse(e.postData.contents);
//
//     if (data.action === 'soloReservation') {
//       const result = submitSoloReservation(data);
//       return jsonResponse(result);
//     }
//
//     // Comportement existant (réservations groupe)
//     const result = submitReservation(data);
//     return jsonResponse(result);
//   } catch (err) {
//     return jsonResponse({ success: false, message: 'Erreur serveur : ' + err.toString() });
//   }
//

// ============================================================
// LECTURE — Weekends solo disponibles (filtre les conflits groupe)
// ============================================================
function getSoloWeekends() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Lire les dates occupées du feuillet Reservations (grands weekends)
  const reservationsSheet = ss.getSheetByName('Reservations');
  const reservationsData = reservationsSheet.getDataRange().getValues();
  const busyDates = [];

  for (var i = 1; i < reservationsData.length; i++) {
    var status = reservationsData[i][3];
    if (status === 'Réservé') {
      var debut = new Date(reservationsData[i][1]);
      var fin = new Date(reservationsData[i][2]);
      // Ajouter une marge : vendredi avant au lundi après (groupe occupe la maison)
      var margeDebut = new Date(debut);
      margeDebut.setDate(margeDebut.getDate() - 1); // vendredi
      var margeFin = new Date(fin);
      margeFin.setDate(margeFin.getDate() + 1); // lundi
      busyDates.push({ start: margeDebut, end: margeFin });
    }
  }

  // Lire le feuillet Solo
  var soloSheet = ss.getSheetByName(SOLO_CONFIG.sheetName);
  if (!soloSheet) return [];

  var soloData = soloSheet.getDataRange().getValues();
  var dispo = [];

  for (var j = 1; j < soloData.length; j++) {
    if (soloData[j][3] !== 'Disponible') continue;

    var soloDebut = new Date(soloData[j][1]);
    var soloFin = new Date(soloData[j][2]);

    // Vérifier pas de conflit avec weekends groupe
    var hasConflict = false;
    for (var k = 0; k < busyDates.length; k++) {
      if (!(soloFin < busyDates[k].start || soloDebut > busyDates[k].end)) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      dispo.push({
        rowIndex: j + 1,
        label: soloData[j][0],
        dateDebut: soloData[j][1],
        dateFin: soloData[j][2]
      });
    }
  }

  return dispo;
}

// ============================================================
// RÉSERVATION SOLO — Anti double-booking + écriture Sheet
// ============================================================
function submitSoloReservation(formData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SOLO_CONFIG.sheetName);
  var rowIndex = parseInt(formData.rowIndex);

  // Protection anti double-booking
  var currentStatus = sheet.getRange(rowIndex, 4).getValue();
  if (currentStatus !== 'Disponible') {
    return {
      success: false,
      message: "Désolé, ce créneau vient d'être pris ! Choisis une autre date."
    };
  }

  // Vérifier aussi les conflits groupe au moment de la résa
  var reservationsSheet = ss.getSheetByName('Reservations');
  var reservationsData = reservationsSheet.getDataRange().getValues();
  var soloDebut = new Date(sheet.getRange(rowIndex, 2).getValue());
  var soloFin = new Date(sheet.getRange(rowIndex, 3).getValue());

  for (var i = 1; i < reservationsData.length; i++) {
    if (reservationsData[i][3] === 'Réservé') {
      var grpDebut = new Date(reservationsData[i][1]);
      var grpFin = new Date(reservationsData[i][2]);
      grpDebut.setDate(grpDebut.getDate() - 1);
      grpFin.setDate(grpFin.getDate() + 1);
      if (!(soloFin < grpDebut || soloDebut > grpFin)) {
        return {
          success: false,
          message: "Ce créneau chevauche un weekend groupe. Choisis une autre date !"
        };
      }
    }
  }

  // Écriture dans le feuillet Solo
  sheet.getRange(rowIndex, 4).setValue('Réservé');
  sheet.getRange(rowIndex, 5).setValue(formData.nom);
  sheet.getRange(rowIndex, 6).setValue(formData.email);
  sheet.getRange(rowIndex, 7).setValue(formData.message || '');
  sheet.getRange(rowIndex, 8).setValue(formData.joursChoisis || '');
  sheet.getRange(rowIndex, 9).setValue(new Date());

  var label = sheet.getRange(rowIndex, 1).getValue();

  // Email de confirmation
  try {
    MailApp.sendEmail({
      to: formData.email,
      subject: '✅ Weekend solo confirmé — ' + label,
      body:
        'Salut ' + formData.nom + ' !\n\n' +
        'C\'est confirmé pour le ' + label + ' en mode solo/tête-à-tête.\n' +
        (formData.joursChoisis ? 'Jours choisis : ' + formData.joursChoisis + '\n' : '') +
        (formData.message ? 'Ton message : « ' + formData.message + ' »\n' : '') +
        '\nÀ très bientôt à St-Georges-sur-Cher !\n' +
        SOLO_CONFIG.hostName
    });
  } catch (e) {
    console.error('Erreur email solo : ' + e.toString());
  }

  return {
    success: true,
    message: 'C\'est confirmé pour le ' + label + ' en solo 🎉 Un email de confirmation t\'a été envoyé !'
  };
}

// ============================================================
// INITIALISATION SOLO — Lance une seule fois pour créer le feuillet
// ============================================================
function initSoloSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SOLO_CONFIG.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(SOLO_CONFIG.sheetName);
  } else {
    var ui = SpreadsheetApp.getUi();
    var rep = ui.alert(
      '⚠️ Attention',
      'Le feuillet "' + SOLO_CONFIG.sheetName + '" existe déjà. Réinitialiser ?',
      ui.ButtonSet.YES_NO
    );
    if (rep !== ui.Button.YES) return;
    sheet.clearContents();
  }

  // En-têtes
  var headers = ['Créneau', 'Date début', 'Date fin', 'Statut', 'Nom', 'Email', 'Message', 'Jours choisis', 'Date réservation'];
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2d4a3e');
  headerRange.setFontColor('#ffffff');

  // Générer des créneaux : chaque weekend (ven-dim + possibilité lun-mar TT)
  // On génère des blocs vendredi→mardi pour chaque semaine
  var weekends = generateSoloWeekends(new Date(2026, 3, 17), new Date(2026, 11, 31));
  var rows = weekends.map(function(w) {
    return [w.label, w.dateDebut, w.dateFin, 'Disponible', '', '', '', '', ''];
  });

  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  sheet.getRange(2, 2, rows.length, 2).setNumberFormat('dd/mm/yyyy');

  // Mise en forme conditionnelle
  var statutRange = sheet.getRange(2, 4, rows.length, 1);
  var rule1 = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Disponible').setBackground('#d9ead3').setFontColor('#274e13').setRanges([statutRange]).build();
  var rule2 = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Réservé').setBackground('#f4cccc').setFontColor('#990000').setRanges([statutRange]).build();
  sheet.setConditionalFormatRules(sheet.getConditionalFormatRules().concat([rule1, rule2]));
  sheet.autoResizeColumns(1, 9);

  SpreadsheetApp.getUi().alert('✅ Feuillet Solo initialisé avec ' + rows.length + ' créneaux !');
}

function generateSoloWeekends(startDate, endDate) {
  var mois = ['jan','fév','mars','avr','mai','juin','juil','août','sep','oct','nov','déc'];
  var weekends = [];

  // Trouver le premier vendredi à partir de startDate
  var current = new Date(startDate);
  while (current.getDay() !== 5) { // 5 = vendredi
    current.setDate(current.getDate() + 1);
  }

  while (current <= endDate) {
    var vendredi = new Date(current);
    var mardi = new Date(current);
    mardi.setDate(mardi.getDate() + 4); // vendredi + 4 = mardi

    var label;
    if (vendredi.getMonth() === mardi.getMonth()) {
      label = vendredi.getDate() + '-' + mardi.getDate() + ' ' + mois[vendredi.getMonth()] + ' ' + vendredi.getFullYear();
    } else {
      label = vendredi.getDate() + ' ' + mois[vendredi.getMonth()] + ' - ' + mardi.getDate() + ' ' + mois[mardi.getMonth()] + ' ' + vendredi.getFullYear();
    }
    label = label + ' (ven→mar)';

    weekends.push({ label: label, dateDebut: vendredi, dateFin: mardi });

    current.setDate(current.getDate() + 7); // un créneau par semaine
  }
  return weekends;
}
