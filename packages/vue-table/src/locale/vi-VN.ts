import type { TableLocale } from './types.js';

export const viVN: TableLocale = {
  code: 'vi-VN',
  direction: 'ltr',
  messages: {
    general: {
      emptyMessage: 'Không tìm thấy kết quả nào.',
      failedToLoad: 'Không thể tải dữ liệu',
      tryAgain: 'Thử lại',
      mobileScrollHint: 'Vuốt ngang để xem thêm cột • Chạm hàng để chỉnh sửa',
    },
    pagination: {
      rowsPerPage: 'Số dòng mỗi trang',
      pageSummary: (page, totalPages) => `Trang ${page} / ${totalPages}`,
      selectedCount: (count) => `Đã chọn ${count} dòng`,
      totalRecords: (total) => `Tổng cộng ${total} bản ghi`,
      firstPage: 'Trang đầu tiên',
      previousPage: 'Trang trước',
      nextPage: 'Trang tiếp theo',
      lastPage: 'Trang cuối cùng',
    },
    toolbar: {
      searchPlaceholder: 'Tìm kiếm dữ liệu...',
      reset: 'Đặt lại',
      viewOptionsTrigger: 'Cột hiển thị',
      viewOptionsTitle: 'Tùy chọn hiển thị cột',
    },
    floatingBar: {
      selected: (count, total) => (total ? `${count} / ${total}` : `${count} đã chọn`),
      clear: 'Bỏ chọn',
    },
    filterBuilder: {
      title: 'Bộ lọc linh hoạt',
      where: 'Nơi',
      and: 'Và',
      or: 'Hoặc',
      addRule: 'Thêm điều kiện',
      clearAll: 'Xóa tất cả',
      emptyMessage: 'Chưa có điều kiện lọc nào. Bấm nút bên dưới để thêm điều kiện.',
      presetsTitle: 'Mẫu có sẵn',
      noValueNeeded: '(Không cần giá trị)',
      betweenFrom: 'Từ',
      betweenTo: 'Đến',
      selectPlaceholder: 'Chọn giá trị',
      valuePlaceholder: 'Nhập giá trị...',
    },
    cell: {
      clickToEdit: 'Click để chỉnh sửa trực tiếp',
      clickToChangeStatus: 'Click để đổi trạng thái',
      save: 'Lưu (Enter)',
      cancel: 'Hủy (Esc)',
      edited: 'Đã chỉnh sửa',
      copy: 'Sao chép vào khay nhớ tạm',
      copied: 'Đã sao chép!',
    },
    headerMenu: {
      sortAsc: 'Sắp xếp tăng dần',
      sortDesc: 'Sắp xếp giảm dần',
      clearSort: 'Bỏ sắp xếp',
      pinLeft: 'Ghim sang trái',
      pinRight: 'Ghim sang phải',
      unpin: 'Bỏ ghim cột',
      resetSize: 'Đặt lại độ rộng',
      hideColumn: 'Ẩn cột này',
      openMenu: 'Mở menu cột',
    },
    savedViews: {
      viewsTitle: 'Chế độ xem',
      defaultView: 'Mặc định',
      saveCurrentView: 'Lưu chế độ xem hiện tại',
      saveAsNewView: 'Lưu thành chế độ xem mới...',
      viewNamePlaceholder: 'Nhập tên chế độ xem...',
      saveButton: 'Lưu',
      deleteView: 'Xóa chế độ xem',
      confirmDelete: 'Bạn có chắc chắn muốn xóa chế độ xem này không?',
      customViewBadge: 'Tùy chỉnh',
    },
    dateRange: {
      title: 'Ngày',
      placeholder: 'Chọn khoảng ngày',
      presetsTitle: 'Phím tắt',
      today: 'Hôm nay',
      yesterday: 'Hôm qua',
      last7Days: '7 ngày qua',
      last30Days: '30 ngày qua',
      thisMonth: 'Tháng này',
      lastMonth: 'Tháng trước',
      clear: 'Bỏ chọn',
      apply: 'Áp dụng',
    },
  },
  formatters: {
    currency: (value, currencyCode = 'VND') => {
      if (currencyCode === 'VND') {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(value);
      }
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currencyCode,
      }).format(value);
    },
    number: (value) => new Intl.NumberFormat('vi-VN').format(value),
    date: (value, options) => {
      const d = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(
        'vi-VN',
        options || {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }
      ).format(d);
    },
  },
};
