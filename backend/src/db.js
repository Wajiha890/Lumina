// Lumina – MSc Cloud Computing Project
import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

export function createSequelize() {
  const raw = process.env.DATABASE_URL || "sqlite:./media.db";
  let url = raw;
  if (url.startsWith("postgres://")) {
    url = url.replace(/^postgres:\/\//, "postgresql://");
  }
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    const sslmode = (process.env.POSTGRES_SSLMODE || "").toLowerCase();
    const opts = { dialect: "postgres", logging: false };
    if (!/sslmode=/i.test(url) && url.includes("database.azure.com") && sslmode !== "disable") {
      opts.dialectOptions = { ssl: { require: true } };
    }
    return new Sequelize(url, opts);
  }
  const storage = url.replace(/^sqlite:\/\//, "").replace(/^\.\//, "") || "./media.db";
  return new Sequelize({ dialect: "sqlite", storage, logging: false });
}

export function defineModels(sequelize) {
  const User = sequelize.define(
    "User",
    {
      username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(200), allowNull: false },
      role: { type: DataTypes.STRING(20), allowNull: false },
    },
    { tableName: "users", underscored: true }
  );

  const Image = sequelize.define(
    "Image",
    {
      title: { type: DataTypes.STRING(200), allowNull: false },
      caption: { type: DataTypes.STRING(500), defaultValue: "" },
      location: { type: DataTypes.STRING(200), defaultValue: "" },
      people: { type: DataTypes.STRING(200), defaultValue: "" },
      imageUrl: { type: DataTypes.STRING(500), allowNull: false, field: "image_url" },
      mediaType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "image", field: "media_type" },
      uploadMethod: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "url", field: "upload_method" },
      userId: { type: DataTypes.INTEGER, allowNull: true, field: "user_id" },
    },
    { tableName: "images", underscored: true }
  );

  const Comment = sequelize.define(
    "Comment",
    {
      text: { type: DataTypes.STRING(500), allowNull: false },
    },
    { tableName: "comments", underscored: true }
  );

  const Rating = sequelize.define(
    "Rating",
    {
      value: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "ratings",
      underscored: true,
      indexes: [{ unique: true, fields: ["image_id", "user_id"] }],
    }
  );

  const Reaction = sequelize.define(
    "Reaction",
    {
      reactionType: { type: DataTypes.STRING(20), allowNull: false, field: "reaction_type" },
    },
    {
      tableName: "reactions",
      underscored: true,
      indexes: [{ unique: true, fields: ["image_id", "user_id"] }],
    }
  );

  User.hasMany(Image, { foreignKey: "userId", as: "images" });
  Image.belongsTo(User, { foreignKey: "userId", as: "uploader" });

  User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
  Comment.belongsTo(User, { foreignKey: "userId", as: "author" });
  Image.hasMany(Comment, { foreignKey: "imageId", as: "comments" });
  Comment.belongsTo(Image, { foreignKey: "imageId", as: "image" });

  User.hasMany(Rating, { foreignKey: "userId", as: "ratings" });
  Rating.belongsTo(User, { foreignKey: "userId", as: "rater" });
  Image.hasMany(Rating, { foreignKey: "imageId", as: "ratings" });
  Rating.belongsTo(Image, { foreignKey: "imageId", as: "image" });

  User.hasMany(Reaction, { foreignKey: "userId", as: "reactions" });
  Reaction.belongsTo(User, { foreignKey: "userId", as: "reactor" });
  Image.hasMany(Reaction, { foreignKey: "imageId", as: "reactions" });
  Reaction.belongsTo(Image, { foreignKey: "imageId", as: "image" });

  return { User, Image, Comment, Rating, Reaction };
}

export async function syncAndSeed(sequelize, models) {
  const { User } = models;
  await sequelize.sync();
  const creator = await User.findOne({ where: { role: "creator" } });
  if (!creator) {
    const hash = await bcrypt.hash(process.env.SEED_CREATOR_PASSWORD || "Wajiha123", 10);
    await User.create({
      username: process.env.SEED_CREATOR_USERNAME || "Wajiha",
      password: hash,
      role: "creator",
    });
  }
}
