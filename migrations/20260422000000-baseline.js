'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const checkTable = async (tableName) => {
      const tables = await queryInterface.showAllTables();
      return tables.includes(tableName);
    };

    try {
      // 1. Usuarios
      if (!(await checkTable('usuarios'))) {
        await queryInterface.createTable('usuarios', {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
          nombre: { type: Sequelize.STRING, allowNull: false },
          email: { type: Sequelize.STRING, allowNull: false, unique: true },
          contrasena: { type: Sequelize.STRING, allowNull: false },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE }
        }, { transaction });
      }

      // 2. Tableros
      if (!(await checkTable('tableros'))) {
        await queryInterface.createTable('tableros', {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          titulo: { type: Sequelize.STRING, allowNull: false },
          descripcion: { type: Sequelize.TEXT },
          owner_id: { type: Sequelize.UUID, references: { model: 'usuarios', key: 'id' }, onDelete: 'CASCADE' },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE }
        }, { transaction });
      }

      // 3. Listas
      if (!(await checkTable('listas'))) {
        await queryInterface.createTable('listas', {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          titulo: { type: Sequelize.STRING, allowNull: false },
          tableroId: { type: Sequelize.INTEGER, references: { model: 'tableros', key: 'id' }, onDelete: 'CASCADE' },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE }
        }, { transaction });
      }

      // 4. Tarjetas
      if (!(await checkTable('tarjetas'))) {
        await queryInterface.createTable('tarjetas', {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          titulo: { type: Sequelize.STRING, allowNull: false },
          descripcion: { type: Sequelize.TEXT },
          prioridad: { type: Sequelize.ENUM('Baja', 'Media', 'Alta'), defaultValue: 'Media' },
          listaId: { type: Sequelize.INTEGER, references: { model: 'listas', key: 'id' }, onDelete: 'CASCADE' },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE }
        }, { transaction });
      }

      // 5. BoardMembers
      if (!(await checkTable('board_members'))) {
        await queryInterface.createTable('board_members', {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          usuarioId: { type: Sequelize.UUID, references: { model: 'usuarios', key: 'id' }, onDelete: 'CASCADE' },
          tableroId: { type: Sequelize.INTEGER, references: { model: 'tableros', key: 'id' }, onDelete: 'CASCADE' },
          role: { type: Sequelize.ENUM('owner', 'editor', 'viewer'), defaultValue: 'editor' },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE }
        }, { transaction });

        try {
          await queryInterface.addIndex('board_members', ['usuarioId', 'tableroId'], {
            unique: true,
            name: 'unique_user_board',
            transaction
          });
        } catch (e) { /* Index might already exist if table existed partially */ }
      }

      // 6. Invitations
      if (!(await checkTable('invitations'))) {
        await queryInterface.createTable('invitations', {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          boardId: { type: Sequelize.INTEGER, references: { model: 'tableros', key: 'id' }, onDelete: 'CASCADE' },
          inviterId: { type: Sequelize.UUID, references: { model: 'usuarios', key: 'id' }, onDelete: 'CASCADE' },
          inviteeEmail: { type: Sequelize.STRING, allowNull: false },
          role: { type: Sequelize.ENUM('viewer', 'editor', 'owner'), defaultValue: 'viewer' },
          status: { type: Sequelize.ENUM('pending', 'accepted', 'declined'), defaultValue: 'pending' },
          token: { type: Sequelize.STRING, unique: true },
          createdAt: { allowNull: false, type: Sequelize.DATE },
          updatedAt: { allowNull: false, type: Sequelize.DATE }
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('invitations', { transaction });
      await queryInterface.dropTable('board_members', { transaction });
      await queryInterface.dropTable('tarjetas', { transaction });
      await queryInterface.dropTable('listas', { transaction });
      await queryInterface.dropTable('tableros', { transaction });
      await queryInterface.dropTable('usuarios', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
