namespace KecCerts.Application.Common.Models;

public class ExcelParseResult
{
    public List<CertificateRow> Rows { get; set; } = [];
    public List<ImportError> Errors { get; set; } = [];
    public List<ImportError> Warnings { get; set; } = [];
}

public class ProgramParseResult
{
    public List<ProgramRow> Rows { get; set; } = [];
    public List<ImportError> Errors { get; set; } = [];
}

public record ImportError(int Row, string Field, string Message);

public record ProgramRow(
    int RowNumber,
    string Code,              // A - Kodi
    string Name,              // B - Emërtimi
    int? NumberOfHours,       // C - Numri i orëve
    DateOnly? RegistrationDate, // D - Data e regjistrimit
    string? Status,           // E - Statusi
    DateOnly? AccreditationFrom, // F - Akreditimi prej
    DateOnly? AccreditationTo);  // G - Akreditimi deri

public record CertificateRow(
    int RowNumber,
    // Required columns A-E (appear on certificate)
    DateOnly IssueDate,           // B - Data e lëshimit
    string TrainingCode,          // C - Kodi i trajnimit
    string TrainingName,          // D - Emri i trajnimit
    string ParticipantFullName,   // E - Emri dhe mbiemri
    // Optional columns F-O (stored in DB only)
    string? PersonalNumber,       // F - Numri personal
    string? TrainingGroup,        // G - Grupi i trajnimit
    string? Gender,               // H - Gjinia
    string? Position,             // I - Pozita
    string? Subject,              // J - Lënda
    string? InstitutionName,      // K - Emri i institucionit
    string? InstitutionLocation,  // L - Vendi i institucionit
    string? Municipality,         // M - Komuna
    string? InstitutionType,      // N - Tipi i institucionit
    string? TrainingDates);       // O - Datat e mbajtjes
