'use strict';

/**
 * MIGRACIÓN SIMPLIFICADA: Refactorizar Usuario-Tablero → Many-to-Many
 * 
 * Tolerante a fallos - verifica existencia de objetos antes de crearlos
 * Fecha: 2026-04-18
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('[MIGRACIÓN] Iniciando refactorización Usuario-Tablero...\n');

      // PASO 1: Crear tabla board_members
      console.log('[PASO 1] Creando tabla board_members...');
      try {
        await queryInterface.createTable(
          'board_members',
          {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            usuarioId: { type: Sequelize.UUID, allowNull: false, references: { model: 'usuarios', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
            tableroId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tableros', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
            role: { type: Sequelize.ENUM('owner', 'editor', 'viewer'), defaultValue: 'editor', allowNull: false },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
          },
          { transaction }
        );
        console.log('[PASO 1] ✓ Tabla board_members creada\n');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('[PASO 1] - Tabla ya existe\n');
        } else {
          throw err;
        }
      }

      // PASO 2: Índice UNIQUE
      console.log('[PASO 2] Creando índice UNIQUE...');
      try {
        await queryInterface.addIndex('board_members', ['usuarioId', 'tableroId'], { unique: true, name: 'unique_user_board', transaction });
        console.log('[PASO 2] ✓ Índice creado\n');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('[PASO 2] - Índice ya existe\n');
        } else {
          throw err;
        }
      }

      // PASO 3: Agregar owner_id
      console.log('[PASO 3] Agregando columna owner_id a tableros...');
      const hasCol = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='tableros' AND column_name='owner_id';`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );
      
      if (hasCol.length === 0) {
        await queryInterface.addColumn('tableros', 'owner_id', { type: Sequelize.UUID, allowNull: true }, { transaction });
        console.log('[PASO 3] ✓ Columna owner_id agregada (nullable)\n');
      } else {
        console.log('[PASO 3] - Columna ya existe\n');
      }

      // PASO 4: Agregar FK a owner_id
      console.log('[PASO 4] Agregando Foreign Key a owner_id...');
      try {
        await queryInterface.addConstraint('tableros', {
          fields: ['owner_id'],
          type: 'foreign key',
          name: 'fk_tableros_owner_id',
          references: { table: 'usuarios', field: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          transaction,
        });
        console.log('[PASO 4] ✓ Foreign Key agregado\n');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('[PASO 4] - FK ya existe\n');
        } else {
          throw err;
        }
      }

      await transaction.commit();
      console.log('[MIGRACIÓN] ✓ Completada exitosamente\n');
      console.log('[PRÓXIMOS PASOS]\n1. npm run seed    → Crear datos de prueba\n2. npm run dev     → Iniciar servidor\n');

    } catch (error) {
      await transaction.rollback();
      console.error('[MIGRACIÓN] ✗ Error:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('[ROLLBACK] Revirtiendo...\n');

      // Remover FK
      try {
        await queryInterface.removeConstraint('tableros', 'fk_tableros_owner_id', { transaction });
        console.log('[ROLLBACK-1] ✓ FK removido');
      } catch (err) {
        console.log('[ROLLBACK-1] - FK no existía');
      }

      // Remover columna
      try {
        await queryInterface.removeColumn('tableros', 'owner_id', { transaction });
        console.log('[ROLLBACK-2] ✓ Columna removida');
      } catch (err) {
        console.log('[ROLLBACK-2] - Columna no existía');
      }

      // Remover índice
      try {
        await queryInterface.removeIndex('board_members', 'unique_user_board', { transaction });
        console.log('[ROLLBACK-3] ✓ Índice removido');
      } catch (err) {
        console.log('[ROLLBACK-3] - Índice no existía');
      }

      // Remover tabla
      try {
        await queryInterface.dropTable('board_members', { transaction });
        console.log('[ROLLBACK-4] ✓ Tabla removida\n');
      } catch (err) {
        console.log('[ROLLBACK-4] - Tabla no existía\n');
      }

      await transaction.commit();
      console.log('[ROLLBACK] ✓ Completado\n');

    } catch (error) {
      await transaction.rollback();
      console.error('[ROLLBACK] ✗ Error:', error.message);
      throw error;
    }
  },
};
