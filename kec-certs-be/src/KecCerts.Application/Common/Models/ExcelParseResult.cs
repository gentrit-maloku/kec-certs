namespace KecCerts.Application.Common.Models;

public class ExcelParseResult
{
    public bool IsValid => Errors.Count == 0;
    public List<ParticipantRow> Rows { get; set; } = [];
    public List<string> Errors { get; set; } = [];
}

public record ParticipantRow(
    string? ProgramCode,
    string? ProgramName,
    string FirstName,
    string LastName,
    string? PersonalNumber,
    string SerialNumber,
    DateOnly IssueDate,
    string? Grade,
    int RowNumber);
