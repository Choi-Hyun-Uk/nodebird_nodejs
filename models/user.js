const Sequelize = require('sequelize');

// User를 Sequelize 모델로 확장해야 mySQL과 연결
module.exports = class User extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            email: {
                type: Sequelize.STRING(40), // 40자 이내 글자
                allowNull: true, // 필수 아님,
                unique: true, // 고유의 값
            },
            nick: {
                type: Sequelize.STRING(15), // 15자 이내 글자
                allowNull: false,
            },
            password: {
                type: Sequelize.STRING(100), // 100자 이내 글자
                allowNull: true,
            },
            provider: {
                type: Sequelize.STRING(10), // 10자 이내 글자
                allowNull: false,
                defaultValue: 'local',
            },
            snsId: {
                type: Sequelize.STRING(30), // SNS ID 처럼 저장
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: true, // createAt, updateAt 자동 생성
            underscored: false, // sequelize에서 _ 사용할지 말지 ex) createAt -> create_at
            paranoid: true, // deleteAt을 생성 (삭제한 날짜)
            modelName: 'User', // modelName - javascript에서 쓰인다.
            tableName: 'users', // tableName - SQL에서 쓰이며, modelName의 소문자로 하고, 복수형으로 짓는다.
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }

    // 시퀄라이즈 관계 설정
    static associate(db) {
        // 1:다 관계 : 하나의 유저는 여러 게시글을 쓸 수 있다.
        db.User.hasMany(db.Post);

        // 다:다 관계 : 하나의 유저는 여러 팔로우를 할 수 있지만, 같은 테이블 안에서는 다:다 관계유지
        db.User.belongsToMany(db.User, { 
            foreignKey: 'followingId',
            as: 'Followers', // javascript에서 get 메소드로 가져올 수 있다. 그래서 테이블의 이름을 변경
            through: 'Follow', // 다:다 관계에서는 중간 테이블이 생성되고, 그 테이블의 이름이다.
        });
        db.User.belongsToMany(db.User, { 
            foreignKey: 'followerId',
            as: 'Followings',
            through: 'Follow',
        })
    }
}