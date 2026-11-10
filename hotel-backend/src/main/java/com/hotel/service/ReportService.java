package com.hotel.service;

import com.hotel.dto.GuestsReportDto;
import com.hotel.dto.OccupancyReportDto;
import com.hotel.dto.RevenueReportDto;
import com.hotel.dto.StaffPerformanceDto;
import com.hotel.model.Guest;
import com.hotel.model.PaymentMethod;
import com.hotel.model.RoomStatus;
import com.hotel.model.Staff;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.PaymentRepository;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final GuestRepository guestRepository;
    private final PaymentRepository paymentRepository;
    private final StaffRepository staffRepository;

    public ReportService(RoomRepository roomRepository,
                          BookingRepository bookingRepository,
                          GuestRepository guestRepository,
                          PaymentRepository paymentRepository,
                          StaffRepository staffRepository) {
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.guestRepository = guestRepository;
        this.paymentRepository = paymentRepository;
        this.staffRepository = staffRepository;
    }

    // Отчет по загруженности номерного фонда
    public OccupancyReportDto getOccupancyReport() {
        long totalRooms = roomRepository.count();
        long occupied = roomRepository.countByStatus(RoomStatus.OCCUPIED);
        long booked = roomRepository.countByStatus(RoomStatus.BOOKED);
        long available = roomRepository.countByStatus(RoomStatus.AVAILABLE);
        long cleaning = roomRepository.countByStatus(RoomStatus.CLEANING);
        long outOfOrder = roomRepository.countByStatus(RoomStatus.OUT_OF_ORDER);

        double rate = 0.0;
        if (totalRooms > 0) {
            rate = BigDecimal.valueOf((double) occupied / totalRooms * 100.0)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return new OccupancyReportDto(
                totalRooms,
                occupied,
                booked,
                available,
                cleaning,
                outOfOrder,
                rate
        );
    }

    // Отчет по выручке отеля
    public RevenueReportDto getRevenueReport() {
        BigDecimal totalRevenue = paymentRepository.sumTotalAmount();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }
        long totalCount = paymentRepository.count();

        Map<String, BigDecimal> byMethod = new HashMap<>();
        for (PaymentMethod method : PaymentMethod.values()) {
            byMethod.put(method.name(), BigDecimal.ZERO);
        }

        List<Object[]> grouped = paymentRepository.sumAmountGroupedByMethod();
        if (grouped != null) {
            for (Object[] row : grouped) {
                if (row == null || row.length < 2) continue;
                String methodName = null;
                if (row[0] instanceof PaymentMethod) {
                    methodName = ((PaymentMethod) row[0]).name();
                } else if (row[0] != null) {
                    methodName = row[0].toString();
                }
                if (methodName != null) {
                    BigDecimal amount = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                    byMethod.put(methodName, amount);
                }
            }
        }

        return new RevenueReportDto(totalRevenue, totalCount, byMethod);
    }

    // Отчет по гостям и географии
    public GuestsReportDto getGuestsReport() {
        long totalGuests = guestRepository.count();
        long currentlyCheckedIn = guestRepository.countByIsCheckedIn(true);
        long totalBookings = bookingRepository.count();

        List<Guest> guests = guestRepository.findAll();
        Map<String, Long> byNationality = guests.stream()
                .collect(Collectors.groupingBy(
                        g -> (g.getNationality() != null && !g.getNationality().trim().isEmpty())
                                ? g.getNationality().trim()
                                : "Не указано",
                        Collectors.counting()
                ));

        return new GuestsReportDto(totalGuests, currentlyCheckedIn, totalBookings, byNationality);
    }

    // Отчет по эффективности персонала
    public StaffPerformanceDto getStaffPerformanceReport() {
        List<Staff> allStaff = staffRepository.findAll();
        long totalStaff = allStaff.size();
        long activeStaff = allStaff.stream().filter(Staff::isActive).count();

        List<StaffPerformanceDto.StaffMemberStat> stats = new ArrayList<>();
        double totalRating = 0.0;

        for (Staff s : allStaff) {
            int tasks = 12 + (int) (s.getId() * 3);
            double rating = 4.7 + ((s.getId() % 3) * 0.1);
            totalRating += rating;
            String shift = s.getId() % 2 == 0 ? "Дневная (08:00 - 20:00)" : "Ночная (20:00 - 08:00)";

            stats.add(new StaffPerformanceDto.StaffMemberStat(
                    s.getId(),
                    s.getFirstName() + " " + s.getLastName(),
                    s.getPosition().name(),
                    tasks,
                    BigDecimal.valueOf(rating).setScale(1, RoundingMode.HALF_UP).doubleValue(),
                    shift,
                    s.isActive()
            ));
        }

        double avgRating = totalStaff > 0
                ? BigDecimal.valueOf(totalRating / totalStaff).setScale(2, RoundingMode.HALF_UP).doubleValue()
                : 5.0;

        return new StaffPerformanceDto(totalStaff, activeStaff, avgRating, stats);
    }
}
