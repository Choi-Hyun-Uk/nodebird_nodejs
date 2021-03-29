const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      content: {
        type: Sequelize.STRING(140), // 140자 이내 글자
        allowNull: false, // 필수
      },
      img: {
        type: Sequelize.STRING(200), // 이미지 파일 명 200자 이내 글자 (1개만 가능, 그 이상은 다른 코드 작성해야함.)
        allowNull: true, // 필수아님
      },
    }, {
        sequelize,
        timestamps: true, // createAt, updateAt 자동 생성
        underscored: false, // sequelize에서 _ 사용할지 말지 ex) createAt -> create_at
        paranoid: false, // deleteAt을 생성 (삭제한 날짜)
        modelName: 'Post', // modelName - javascript에서 쓰인다.
        tableName: 'posts', // tableName - SQL에서 쓰이며, modelName의 소문자로 하고, 복수형으로 짓는다.
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    });
  }
  static associate(db) {
    db.Post.belongsTo(db.User); // 1:다 관계의 belongsTo
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' }); // 다:다 관계
  }
};