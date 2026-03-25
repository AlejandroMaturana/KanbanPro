const Usuario = require("./Usuario");
const Tablero = require("./Tablero");
const Lista = require("./Lista");
const Tarjeta = require("./Tarjeta");

// --- RELACIONES (uno a muchos) ---

// Un usuario puede tener muchos tableros
Usuario.hasMany(Tablero, { foreignKey: "usuarioId", onDelete: "CASCADE", as: 'tableros' });
Tablero.belongsTo(Usuario, { foreignKey: "usuarioId", as: 'usuario' });

// Un tablero puede tener muchas listas
Tablero.hasMany(Lista, { foreignKey: "tableroId", onDelete: "CASCADE", as: 'listas' });
Lista.belongsTo(Tablero, { foreignKey: "tableroId", as: 'tablero' });

// Una lista puede tener muchas tarjetas
Lista.hasMany(Tarjeta, { foreignKey: "listaId", onDelete: "CASCADE", as: 'tarjetas' });
Tarjeta.belongsTo(Lista, { foreignKey: "listaId", as: 'lista' });

module.exports = { Usuario, Tablero, Lista, Tarjeta };
