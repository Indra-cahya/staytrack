const User = require('./User');
const Room = require('./Room');
const Bill = require('./Bill');
const Payment = require('./Payment');

/**
 * [MODULARITY & AGGREGATION]
 * File ini berfungsi sebagai "Barrel Export". 
 * Dalam arsitektur OOP, ini meningkatkan Modularitas dengan mengelompokkan 
 * semua entitas model ke dalam satu namespace tunggal.
 * * [HIGH-LEVEL ABSTRACTION]
 * Ini mempermudah Controller untuk berinteraksi dengan layer Model. 
 * Controller tidak perlu mengetahui detail lokasi file fisik tiap model, 
 * cukup mengaksesnya melalui entry point ini (Encapsulating the folder structure).
 */
module.exports = {
    User,
    Room,
    Bill,
    Payment
};