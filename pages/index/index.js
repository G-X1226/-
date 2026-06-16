Page({
  data: {
    participantName: '',
    participants: [],
    winner: '',
    canAdd: false
  },

  handleNameInput(event) {
    const value = event.detail.value || '';
    this.setData({
      participantName: value,
      canAdd: value.trim().length > 0
    });
  },

  addParticipant() {
    const name = this.data.participantName.trim();
    if (!name) {
      return;
    }

    const { participants } = this.data;
    if (participants.includes(name)) {
      wx.showToast({
        title: '该姓名已在名单中',
        icon: 'none'
      });
      return;
    }

    const updatedParticipants = participants.concat(name);
    this.setData({
      participants: updatedParticipants,
      participantName: '',
      canAdd: false
    });
  },

  removeParticipant(event) {
    const index = event.currentTarget.dataset.index;
    const updatedParticipants = this.data.participants.filter((_, idx) => idx !== index);
    this.setData({
      participants: updatedParticipants
    });

    if (updatedParticipants.length === 0) {
      this.setData({ winner: '' });
    }
  },

  clearParticipants() {
    if (!this.data.participants.length) {
      return;
    }

    wx.showModal({
      title: '清空名单',
      content: '确定要清空所有参与者吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            participants: [],
            participantName: '',
            winner: '',
            canAdd: false
          });
        }
      }
    });
  },

  draw() {
    const { participants } = this.data;
    if (!participants.length) {
      wx.showToast({
        title: '请先添加参与者',
        icon: 'none'
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];

    this.setData({ winner });

    wx.showToast({
      title: '恭喜 ' + winner + '!',
      icon: 'success'
    });

    if (wx.vibrateShort) {
      wx.vibrateShort();
    }
  }
});
