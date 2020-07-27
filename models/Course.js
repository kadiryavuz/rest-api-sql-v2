//Course model
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define(
    "Course",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      //(id from the Users table)
      //   references: {
      //     model: "trainers",
      //     key: "id"
      //   }
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "User",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // (String, nullable)
      estimatedTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // (String, nullable)
      materialsNeeded: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      // Other model options go here
    }
  );

  //associations
  Course.associate = (models) => {
    Course.belongsTo(models.User);
  };

  return Course;
};
