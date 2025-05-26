exports.replay = function (events) {
  const state = {
    stock: 0,
    total_in: 0,
    total_out: 0
  };

  for (const event of events) {
    switch (event.type) {
      case 'product.receive':
        state.stock += event.data.qty;
        state.total_in += event.data.qty;
        break;
      case 'sales.delivery':
        state.stock -= event.data.qty;
        state.total_out += event.data.qty;
        break;
      case 'sales.return':
        state.stock += event.data.qty;
        break;
      case 'purchase.return':
        state.stock -= event.data.qty;
        break;
    }
  }

  return state;
};