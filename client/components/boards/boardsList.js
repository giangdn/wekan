const subManager = new SubsManager();

Template.boardListHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
  'click .js-open-home-view': Popup.open('homeListHeader'),
});

Template.boardListHeaderBar.helpers({
  templatesBoardId() {
    return Meteor.user().getTemplatesBoardId();
  },
  templatesBoardSlug() {
    return Meteor.user().getTemplatesBoardSlug();
  },
});

BlazeComponent.extendComponent({
  events() {
    const currentUser = Meteor.user();
    return [{
      'click .js-toggle-board-view-cal'() {
        currentUser.setBoardView('board-view-cal');
        Popup.close();
      },
      'click .js-toggle-board-view-lists'() {
        currentUser.setBoardView('board-view-lists');
        Popup.close();
      },
      'click .js-toggle-board-view-swimlanes'() {
        currentUser.setBoardView('board-view-swimlanes');
        Popup.close();
      },
    }];
  },
}).register('homeListHeaderPopup');

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
  },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
      type: 'board',
    }, { sort: ['title'] });
  },
  isStarred() {
    const user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },

  hasOvertimeCards() {
    subManager.subscribe('board', this.currentData()._id);
    return this.currentData().hasOvertimeCards();
  },

  hasSpentTimeCards() {
    subManager.subscribe('board', this.currentData()._id);
    return this.currentData().hasSpentTimeCards();
  },

  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(this.currentData()._id);
  },

  events() {
    return [{
      'click .js-add-board': Popup.open('createBoard'),
      'click .js-star-board'(evt) {
        const boardId = this.currentData()._id;
        Meteor.user().toggleBoardStar(boardId);
        evt.preventDefault();
      },
      'click .js-accept-invite'() {
        const boardId = this.currentData()._id;
        Meteor.user().removeInvite(boardId);
      },
      'click .js-decline-invite'() {
        const boardId = this.currentData()._id;
        Meteor.call('quitBoard', boardId, (err, ret) => {
          if (!err && ret) {
            Meteor.user().removeInvite(boardId);
            FlowRouter.go('home');
          }
        });
      },
    }];
  },
}).register('boardList');
